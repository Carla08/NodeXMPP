var express= require("express");
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var xmpp = require('simple-xmpp');
var routes = require('./routes/index');
var users = require('./routes/users');

app.locals.io=io;
app.locals.xmpp=xmpp;





xmpp.on('chat', function(from, message) {
  io.emit("chat message",from+ 'echo: ' + message);
});

app.locals.users={};
app.locals.sockets={};

io.on('connection', function(socket){
  var users={};
  var sockets={};
  socket.on("init", function (jid){
    if(!users[jid]){
      users[jid]=socket.id;
      sockets[socket.id]={
        jid:jid,
        socket:socket
      }
    }
  });

  socket.on('disconnect', function(){
    //var jid= sockets[socket.id].jid;
    //delete sockets[socket.id];
    //delete users[jid];
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  socket.on("chatTo", function (to, msg){
    xmpp.sendMessage(to,msg);
  });
});

















// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});




http.listen(3000, function(){
  console.log('listening on *:3000');
});

module.exports = app;
