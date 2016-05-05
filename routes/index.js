var express = require('express');
var router = express.Router();


//var user ="mario";
var user ="mario";
//var password="ithe2ichi7osel";
var password="mario";
var domain="cml.chi.itesm.mx";
var port = 5222;
/* GET home page. */
router.get('/', function(req, res, next) {
  req.app.locals.xmpp.connect({
    jid: user+"@"+domain,
    password: password,
    host: domain,
    port: port
  });

  req.app.locals.xmpp.on('online', function(data) {
    console.log('Connected with JID: ' + data.jid.user);
    console.log('Yes, I\'m connected!');
    req.app.locals.xmpp.setPresence("chat");
    res.render('chat', { jid: data.jid.user+"@"+data.jid._domain });
  });
});

router.post("/", function(req,res,next){
  req.app.locals.xmpp.login(user,password, req.app.locals.io,(jid)=>{
    res.render('chat', { jid: jid });
  });
});

router.get("/logoff" ,(req,res,next)=>{
  xmpp.disconnect();
  res.send("You are fucking out!");

});

module.exports = router;
