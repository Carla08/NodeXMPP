var express = require('express');
var path = require('path');
var fs= require("fs");
var router = express.Router();


//var user ="mario";
//var user ="dave";
////var password="ithe2ichi7osel";
//var password="dave";
var domain="cml.chi.itesm.mx";
//var port = 5222;
/* GET home page. */
router.get('/', function(req, res, next) {

  if (req.cookies.jid && req.cookies.password){
    res.render('chat', {
      jid: req.body.username + "@" + domain,
      password: req.body.password});
  }else{
    res.render("index",{});
  }

});

router.post("/", function(req,res,next){
  res.cookie("jid",req.body.username + "@" + domain);
  res.cookie("password",req.body.password);
  req.app.locals.res=res;
  req.app.locals.req=req;
  res.render('chat', {
    jid: req.body.username + "@" + domain,
    password: req.body.password});
  }
);

router.get("/logoff" ,(req,res,next)=>{
  var jid= req.cookies.jid;
  delete req.app.locals.users[jid];
  res.clearCookie("jid");
  res.clearCookie("password");
  req.app.locals.xmpp.disconnect();
  res.redirect("/");
});

router.post("/files/:user" ,(req,res,next)=>{
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    console.log("Uploading: " + filename);
    fstream = fs.createWriteStream(path.join(__dirname, path.join('/files/', req.params.user+filename)));
    file.pipe(fstream);
    fstream.on('close', function (){
      res.send('/files/'+req.params.user+filename);
    });
  });
});

router.get("/files/:filename" ,(req,res,next)=>{
  var file = __dirname + '/files/'+req.params.filename;
  res.download(file); // Set
});

module.exports = router;
