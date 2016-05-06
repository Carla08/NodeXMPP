var express = require('express');
var router = express.Router();


//var user ="mario";
//var user ="dave";
////var password="ithe2ichi7osel";
//var password="dave";
var domain="cml.chi.itesm.mx";
//var port = 5222;
/* GET home page. */
router.get('/', function(req, res, next) {

  res.render("index", {});


  // logOff = function () {
  //   req.app.locals.xmpp.disconnect();
  // }
  
});

router.post("/", function(req,res,next){
  res.cookie("jid",req.body.username + "@" + domain);
  req.app.locals.res=res;
  req.app.locals.req=req;
  res.render('chat', {
    jid: req.body.username + "@" + domain,
    password: req.body.password});


});

router.get("/logoff" ,(req,res,next)=>{
  req.app.locals.xmpp.disconnect();
  res.send("You are fucking out!");

});

module.exports = router;
