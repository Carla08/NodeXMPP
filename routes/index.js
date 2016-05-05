var express = require('express');
var router = express.Router();


//var user ="mario";
var user ="dave";
//var password="ithe2ichi7osel";
var password="dave";
var domain="cml.chi.itesm.mx";
var port = 5222;
/* GET home page. */
router.get('/', function(req, res, next) {

  res.render("index", {});


  // logOff = function () {
  //   req.app.locals.xmpp.disconnect();
  // }
  
});

router.post("/", function(req,res,next){
  req.app.locals.xmpp.connect({
    jid: req.body.username + "@" + domain,
    password: req.body.password,
    host: domain,
    port: port
  });

  req.app.locals.xmpp.on('online', function(data) {
    console.log('Connected with JID: ' + data.jid.user);
    console.log('Yes, I\'m connected!');
    res.render('chat', { jid: data.jid });
  });
  
});

module.exports = router;
