var express= require("express");
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var SimpleXMPP = require('simple-xmpp').SimpleXMPP;
var routes = require('./routes/index');
var busboy = require('connect-busboy');
var session =require("express-session");
var lastmessage="";
app.use(busboy());

var port = 5222;
var domain="cml.chi.itesm.mx";
app.locals.io=io;


var users={};
var sockets={};

var allXMPPClients=[];
//XMPP MTHODS:

//var contacts_state = [];
//This sends the request for contacts to the xmpp server.




io.on('connection', function(socket){
  var xmpp = new SimpleXMPP();
  xmpp.user;
  socket.on("init", function (jid,password,custom_host, custom_domain, custom_port){
    domain = custom_host || custom_domain || domain;
    port = custom_port || port;
    try{
      xmpp.connect({
        jid: jid,
        password: password,
        host: domain,
        port: port
      });
    }catch (e){
      console.log(e.message)
    }


    xmpp.on('online', function (data) {
      xmpp.user= data.jid.user+"@"+data.jid._domain;
        console.log('Connected with JID: ' + xmpp.user);
        console.log('Yes, I\'m connected!');
          users[xmpp.user] = socket.id;
          sockets[socket.id] = {
            jid: jid,
            socket: socket
          };


        xmpp.getRoster();
        xmpp.setPresence("chat");
      });
  });
  xmpp.on('stanza', function(stanza) {
      var contacts = [];
      if (stanza.attrs.id == 'roster_0' ) {
        stanza.children[0].children.forEach(function(element, index) {
          contacts.push(element.attrs.jid);
        });
        contacts.forEach(function (contact,index, array){

            var temp = {jid : contact};
            var user= getSocket(xmpp.user);
            if(user)
              user.socket.emit("append", temp);

        });
      }
      else if(stanza.is('presence') && stanza.attrs.type === "subscribe" && app.locals.session && users[app.locals.session.jid]){
        //TO DO: SHOW FRIND REQUEST
        var user= getSocket(xmpp.user);
        user.socket.emit('showFriendRequest', stanza.attrs.from);
      }else if(stanza.is("message") && (stanza.attrs.from.indexOf("conference") != -1) && (stanza.attrs.type==="normal")) {
        var group_name = stanza.attrs.from.split("@")[0];
        var inviter = stanza.children[0].children[0].attrs.from.split("@")[0];
        var message = stanza.children[0].children[0].getChild("reason").getText();
        console.log("Group name: "+ group_name + " Inivter: " + inviter + "message: " + message);
        socket.emit("showGroupMessage", group_name, inviter,message);
      }
  });
  socket.on('disconnect', function(){
    if (app.locals.session){
      users[app.locals.session.jid]=undefined;

    }
    delete sockets[socket.id];
    try{
      xmpp.disconnect();
    }catch (err){
      console.log(err);
    }

    //var jid= sockets[socket.id].jid;
    //delete sockets[socket.id];
    //delete users[jid];

    console.log('User disconnected');
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
  socket.on("chatTo", function (to, msg){
    if (to.search("conference")!== -1){
      xmpp.send(to,msg,true);
    }else{
      xmpp.send(to,msg);
    }

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

      var user = getSocket(xmpp.user);
      if (user) user.socket.emit("buddy",jid,state);

  });
  xmpp.on('chat', function(from, message) {
    if(lastmessage!== (from+message)){
      lastmessage=from+message;
      var user= getSocket(xmpp.user);
      if(user){
        user.socket.emit("chat message", from,message);
      }
    }

  });
  xmpp.on('groupchat', function(room, from, message) {
    var user= getSocket(xmpp.user);
    user.socket.emit("groupchat", room, from, message);
  });
  socket.on ("createGroup", function (jid,user_nick, group_name, members, message){

    var room_name = group_name + "@conference."+jid.split("@")[1];
    var room_creator = room_name + "/" +user_nick;
    xmpp.join(room_creator);
    var people = members.split(",");
    people.forEach(function (person, index, array){
      var person_jid = person.replace(/ /g,'') + "@"+jid.split("@")[1];
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
app.use(session({secret: 'ssshhhhh'}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));


app.get('/', function(req, res, next) {

  var session= req.session;
  if (session.jid && session.password){
    res.render('chat', {
      jid: session.jid,
      password: session.password});
  }else{
    res.render("index",{});
  }

});

app.post("/", function(req,res,next){
      var userDomain=req.body.domain || domain;

  var session= req.session;
  req.app.locals.session=session;
      session.jid=req.body.username + "@" + userDomain;
      session.password=req.body.password;

      res.render('chat', {
        jid: session.jid,
        password: req.body.password,
        host: req.body.host,
        domain: userDomain,
        port: req.body.port
      });
      res.end();
    }
);


app.get("/logoff" ,(req,res,next)=>{
  var jid= req.session.jid;
  delete users[jid];
  req.session.destroy();
  res.clearCookie("jid");
  res.clearCookie("password");
  //xmpp.disconnect();
  res.redirect("/");
});

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