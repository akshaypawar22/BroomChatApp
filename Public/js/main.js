const chatForm = document.getElementById('chat-form');
const chatMessage = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

const socket = io();

// Get Username and room from URL
const { username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
})

// join chat room
socket.emit('joinRoom', {username, room});

// get room and users
socket.on('roomUsers', ({room,users})=>{
    outputRoomName(room)
    outputUsers(users)
});

// Message from server
socket.on('message', message =>{
    console.log(message);
    outputMessage(message);

    // Scroll Down
    chatMessage.scrollTop = chatMessage.scrollHeight;
});

// Message Submit
chatForm.addEventListener('submit', e=>{
    e.preventDefault();

    // Get Message Text
    const msg = e.target.elements.msg.value;

    // Emit Message to server
    socket.emit('chatMessage',msg)

    // clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

})

// output message to DOM 
function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML=`<p class="meta">${message.username}<span> ${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room){
    roomName.innerText = room;
}

// Add user to DOM
function outputUsers(users) {
    userList.innerHTML = '';
    users.forEach((user) => {
      const li = document.createElement('li');
      li.innerText = user.username;
      userList.appendChild(li);
    });
}