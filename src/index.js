const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('../src/utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = new express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

// let count = 0;

// recieve event for client connect to server
io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  /*
  // emit custom event from server to single specific client
  socket.emit('countUpdated', count);

  // recieve custom event from client to server
  socket.on('increment', () => {
    count++;
    // emit event from server to specific single client
    // socket.emit('countUpdated', count);
    // emit event from server to all clients
    io.emit('countUpdated', count);
  });
   */

  // server emits custom event to specific single client
  // socket.emit('message', 'Welcome!');
  // socket.emit('message', generateMessage('Welcome!'));

  // server emits custome event to all users except spefic single user (call as broadcasting)
  // socket.broadcast.emit('message', 'A new user has joined');
  // socket.broadcast.emit('message', generateMessage('A new user has joined'));

  // recieve event for joining to a room from client [ , (callback is for Event Acknowledgement) ]
  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    // join to room
    socket.join(user.room);

    // server emits custom event to specific single client
    socket.emit('message', generateMessage('Admin', 'Welcome!'));

    // server emits custom event to all users except spefic single user in a specific room (call as broadcasting)
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));

    // server emits custom event to all users in a specific room
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback(); // for Event Acknowledgement
  });

  // recieve custom event from client to server [ , (callback is for Event Acknowledgement) ]
  socket.on('sendMessage', (message, callback) => {
    // getUser for user Object to know room
    const user = getUser(socket.id);

    const filter = new Filter();

    // check for bad words
    if (filter.isProfane(message)) {
      // return Event Acknowledgement with message
      return callback('Profanity is not allowed!');
    }

    // emit custom event from server to all clients
    // io.emit('message', message);

    // emit custom event from server to all clients in a specific room
    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback(); // for Event Acknowledgement
  });

  // recieve custom event from client to server [ , (callback is for Event Acknowledgement) ]
  socket.on('sendLocation', (coords, callback) => {
    // getUser for user Object to know room
    const user = getUser(socket.id);

    // io.emit('message', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`);

    // emit custom event from server to all clients in a specific room
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
    callback(); // for Event Acknowledgement
  });

  // recieve event for client disconnect from server
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    // io.emit('message', 'A user has left!');
    // io.emit('message', generateMessage('A user has left!'));

    if (user) {
      // emit event from server to all users in a specific room
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));

      // server emits custom event to all users in a specific room
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
    
  });

});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});