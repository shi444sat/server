const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://suhani-96c78.firebaseio.com'
});

const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('dist'));

const rooms = {};

io.on('connection', (socket) => {
  socket.on('joinRoom', async ({ username, room }) => {
    if (rooms[room] && rooms[room].includes(username)) {
      socket.emit('usernameExists', 'Username already exists in this room');
      return;
    }
    socket.join(room);
    socket.username = username;
    socket.room = room;

    if (!rooms[room]) {
      rooms[room] = [];
    }
    rooms[room].push(username);

    // Retrieve chat history from Firebase
    const chatHistory = await db.collection('rooms').doc(room).collection('messages').orderBy('timestamp').get();
    chatHistory.forEach(doc => {
      socket.emit('message', doc.data().message);
      if (doc.data().imageUrl) {
        socket.emit('image', { data: doc.data().imageUrl, username: doc.data().username });
      }
    });

    io.to(room).emit('join', `${username} has joined the chat 🕺`);
    io.to(room).emit('roomData', {
      room,
      users: rooms[room],
    });
  });

  socket.on('chatMessage', async ({ room, message, username }) => {
    const messageData = {
      username,
      message: `${username}: ${message}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('rooms').doc(room).collection('messages').add(messageData);
    io.to(room).emit('message', messageData.message);
  });

  socket.on('disconnect', () => {
    const room = socket.room;
    const username = socket.username;

    if (room && username) {
      rooms[room] = rooms[room].filter(user => user !== username);
      io.to(room).emit('leave', `${username} has left the chat 🥲`);
      socket.to(room).emit('roomData', {
        room,
        users: rooms[room],
      });
    }
  });
});

server.listen(3042, () => {
  console.log('Server is running on port 3042');
});
