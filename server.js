const express = require("express");
const mongo = require("mongodb").MongoClient;
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botname = "B-Bot";

mongo.connect("mongodb://127.0.0.1", function (err, client) {
  if (err) {
    throw err;
  }
  var db = client.db("mongochat");

  console.log("MongoDB connected...");

  // Run when client connects
  io.on("connection", (socket) => {
    let chat = db.collection("chats");
    socket.on("joinRoom", ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
      socket.join(user.room);

      // this emits the single client that are connecting
      // Welcome Current User
      socket.emit("message", formatMessage(botname, "Welcome to ChatApp!"));

      //Broadcast when a users connect
      // this emits to all client except to client that are connecting
      socket.broadcast.to(user.room).emit(
        // this will broadcast the message in specific room
        "message",
        formatMessage(botname, `${user.username} has Joined the Chat`)
      );

      // send users and room info so we can use it in side bar
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });

      // io.emit sends or emit everybody
    });

    // Listen for ChatMessage ( get message from client and display to server)
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);

      // emit message to everybody on that specific room
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });

    //Runs when client is disconnect
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botname, `${user.username} has left the Chat`)
        );

        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });

    // Get chats from mongo collection
    chat
      .find()
      .limit(100)
      .sort({ _id: 1 })
      .toArray(function (err, res) {
        if (err) {
          throw err;
        }

        // Emit the messages
        socket.emit("output", res);
      });
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server Running on PORT ${PORT}`);
});
