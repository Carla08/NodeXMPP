var express= require("express");
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var xmpp = require('simple-xmpp');
var routes = require('./routes/index');
var users = require('./routes/users');
var busboy = require('connect-busboy');
app.use(busboy());

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

  socket.on("init", function (jid,password,isMobile){
    if (users.hasOwnProperty(jid)){
      app.locals.users[jid] = socket.id;
      app.locals.sockets[socket.id] = {
        jid: jid,
        socket: socket
      };
      xmpp.getRoster();
      xmpp.setPresence("chat");
    }else {
      xmpp.connect({
        jid: jid,
        password: password,
        host: domain,
        port: port
      });

    }
    xmpp.on('online', function (data) {
      console.log('Connected with JID: ' + data.jid.user);
      console.log('Yes, I\'m connected!');
      if (!users[jid]) {
        app.locals.users[jid] = socket.id;
        app.locals.sockets[socket.id] = {
          jid: jid,
          socket: socket
        };

        if (isMobile) {
          socket.emit("mobileLogged")
        }

      }
      xmpp.getRoster();
      xmpp.setPresence("chat");

    });


    xmpp.on('stanza', function(stanza) {
      var contacts = [];
      if (stanza.attrs.id == 'roster_0' && app.locals.req && users[app.locals.req.cookies.jid]) {
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
      else if(stanza.is('presence') && stanza.attrs.type === "subscribe" && app.locals.req && users[app.locals.req.cookies.jid]){
        //TO DO: SHOW FRIND REQUEST
        var user= getSocket(app.locals.req.cookies.jid);
        user.socket.emit('showFriendRequest', stanza.attrs.from);
      }else if(stanza.is("message") && (stanza.attrs.from.indexOf("conference") != -1) && (stanza.attrs.type==="normal")) {
        var group_name = stanza.attrs.from.split("@")[0];
        var inviter = stanza.children[0].children[0].attrs.from.split("@")[0];
        var message = stanza.children[0].children[0].getChild("reason").getText();
        console.log("Group name: "+ group_name + " Inivter: " + inviter + "message: " + message);
        socket.emit("showGroupMessage", group_name, inviter,message);
      }
    });
  });

  socket.on('disconnect', function(){
    if (app.locals.req){
      users[app.locals.req.cookies.jid]=undefined;

    }
    delete sockets[socket.id];
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

  socket.on("setPresence", function(presence) {
    switch (presence) {
      case "online" :
        xmpp.setPresence('online', 'Free to chat');
        break;
      case "away" :
        xmpp.setPresence('away', 'Not quite here');
        break;
      case "offline" :
        xmpp.setPresence('offline', 'Not here');
        break;
    }
    console.log("User presence: " + presence);
  });

  xmpp.on('buddy', function(jid, state, statusText,resource) {
    if(app.locals.req && users.hasOwnProperty(app.locals.req.cookies.jid)){
      var user = getSocket(app.locals.req.cookies.jid);
      user.socket.emit("buddy",jid,state);
    }

  });

  xmpp.on('chat', function(from, message) {
    var user= getSocket(app.locals.req.cookies.jid);
    if(user){
      user.socket.emit("chat message", from,message);
    }

  });

  xmpp.on('groupchat', function(room, from, message) {
    socket.emit("groupchat", room, from, message);
  });

  socket.on ("createGroup", function (user_nick, group_name, members, message){

    var room_name = group_name + "@conference.cml.chi.itesm.mx";
    var room_creator = room_name + "/" +user_nick;
    xmpp.join(room_creator);
    var people = members.split(",");
    people.forEach(function (person, index, array){
      var person_jid = person.replace(/ /g,'') + "@cml.chi.itesm.mx";
      xmpp.invite(person_jid, room_name, message);
    });
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




http.listen(process.env.PORT ||3000, function(){
  console.log('listening on *:3000');
});

//module.exports = app;
//