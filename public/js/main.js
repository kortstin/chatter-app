const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');



//Get username and room from URL

const {username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true

});





const socket = io();

//Join chatroom
socket.emit('joinRoom', {username, room});

//Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
})


socket.on('message', message => {
    outputMessage(message);

    //Scroll down on new message
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
});


//Load old messages
socket.on('load old messages', foundItems => {
    outputHistory(foundItems);
    
    //Scroll down on new message
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

//Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    //Get message text
    const msg = e.target.elements.msg.value;

    //Emit message to server
    socket.emit('chatMessage',msg);

    //Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

    
});

//Output message to DOM

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

//Output message log for each room to DOM
function outputHistory(foundItems) {
    
    for (let index = 0; index < foundItems.messages.length; index++) {
        const element = foundItems.messages[index];
        const momentTime = moment(element.time).format('h:mm a');
        const div = document.createElement('div');
        div.classList.add('message');
        div.innerHTML = `<p class="meta">${element.username} <span>${momentTime}</span></p>
        <p class="text">
            ${element.text}
        </p>`;
        document.querySelector('.chat-messages').appendChild(div);
    }
}

//Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

//Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `${users.map(user => `<li>${user.username}</li>`).join('')}`;
}