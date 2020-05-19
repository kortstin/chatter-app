require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./utils/users');
const Room = require("./backend/models/room.model");

const app = express();
const server = http.createServer(app);
const io = socketio(server);


// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chatter Bot';


//Database connection
const uri = process.env.ATLAS_URI;

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({
        username,
        room
    }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);



        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to Chatter!'));

        //Load saved messages for specific room, if messages exist in database
        Room.find({
            roomID: user.room
        }, function (err, foundItems) {
            if (foundItems) {
                foundItems.forEach(foundItems => {
                    socket.emit('load old messages', foundItems);
                    console.log(foundItems);
                });
            } else {
                console.log(err);
            }

        });





        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));

        //Save messages for room to database
        const newMsg = new Room({
            roomID: user.room,
            messages: [{
                username: user.username,
                text: msg
            }]
        })
        newMsg.save((err, result) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Message for room " + user.room + " saved to DB");
                console.log(result);


            }
        });
    });



    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} has left the chat`)
            );

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

    });
});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));