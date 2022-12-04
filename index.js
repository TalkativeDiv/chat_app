const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const lessExpress = require('less-express');
const mustacheExpress = require('mustache-express');
const port = 3000 || process.env.PORT;
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require('./utils/users');
const botName = 'Welcomer Bot';
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/public');

//app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.render('index');
});
app.get('/chat', (req, res) => {
  res.render('chat');
});
app.get('/css/styles.css', lessExpr ss('./public/less/style.less'));
app.get('/js/script.js', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'public', 'js', 'script.js'));
});
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    socket.emit(
      'message',
      formatMessage(
        botName,
        `Welcome,  ${capitalizeFirstLetter(user.username)}!`
      )
    );
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has appeared!`)
      );
    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  console.log('hello new websocket!');

  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} disconnected. 😔`)
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});
server.listen(port, () => console.log(`hello from the ${port}s!`));
