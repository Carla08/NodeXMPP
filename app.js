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

var port = 5222;
var domain="cml.chi.itesm.mx";
app.locals.io=io;
app.locals.xmpp=xmpp;

var users={};
var sockets={};
app.locals.users=users;
app.locals.sockets=sockets;

//XMPP MTHODS:

//var contacts_state = [];
//This sends the request for contacts to the xmpp server.




io.on('connection', function(socket){


  socket.on("init", function (jid,password){
    xmpp.connect({
      jid: jid,
      password: password,
      host: domain,
      port: port
    });
    xmpp.on('online', function(data) {
      console.log('Connected with JID: ' + data.jid.user);
      console.log('Yes, I\'m connected!');
      if(!users[jid]){
        app.locals.users[jid]=socket.id;
        app.locals.sockets[socket.id]={
          jid:jid,
          socket:socket
        };
        xmpp.getRoster();
      }
      xmpp.setPresence("chat");

    });


    xmpp.on('stanza', function(stanza) {
      var contacts = [];
      if (stanza.attrs.id == 'roster_0' && users[app.locals.req.cookies.jid]) {
        stanza.children[0].children.forEach(function(element, index) {
          contacts.push(element.attrs.jid);
        });
        contacts.forEach(function (contact,index, array){
          xmpp.probe(contact, function(state) {
            var temp = {jid : contact, state: state };
            var user= getSocket(app.locals.req.cookies.jid);
            user.socket.emit("append", temp);
          });
        });
      }
      if(stanza.is('presence') && stanza.attrs.type === "subscribe" && users[app.locals.req.cookies.jid]){
        //TO DO: SHOW FRIND REQUEST
        var user= getSocket(app.locals.req.cookies.jid);
        user.socket.emit('showFriendRequest', stanza.attrs.from);
      }
    });
  });

  socket.on('disconnect', function(){
    //var jid= sockets[socket.id].jid;
    //delete sockets[socket.id];
    //delete users[jid];
    console.log('User disconnected');
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  socket.on("chatTo", function (to, msg){
    xmpp.send(to,msg);
  });

  socket.on("addFriend", function (friend){
    xmpp.subscribe(friend+"@"+domain);
    xmpp.acceptSubscription(friend);
  });

  socket.on("acceptFriend", function (new_friend){
    xmpp.acceptSubscription(new_friend);
  });



  xmpp.on('chat', function(from, message) {
    var user= getSocket(app.locals.req.cookies.jid);
    user.socket.emit("chat message", app.locals.req.cookies.jid,message);
  });

  var getSocket = function (jid){
    return sockets[users[jid]];

  }
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
//app.use('/users', users);

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
