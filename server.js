const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')

require("dotenv").config({ path: "./config/.env" });

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'good Bot'

// Run when client connects
io.on('connection', socket =>{
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin( socket.id, username, room )
        socket.join(user.room)
// welcome current user
socket.emit('message', formatMessage(botName, 'Welcome to the Chat!'));

// Broadcase when a user connects - sends message to everyone but the user that is connecting
socket.broadcast
    .to(user.room)
    .emit('message',  formatMessage(botName, `${user.username} has joined the chat`));

    // Send users and room info to sidebar
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })
    // Listen for chatMessage
    socket.on('chatMessage', msg =>{
        const user = getCurrentUser(socket.id)
        if(user){
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    }
    })
// Runs when client Disconnects (needs to be inside connection)
socket.on('disconnect', () =>{
    const user = userLeave(socket.id)
    if(user){
        io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`))
            // Send users and room info to sidebar
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
    }   
    })

})








server.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));