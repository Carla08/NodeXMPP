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
  req.app.locals.req=req;
  req.app.locals.res=res;
  if (req.cookies.jid && req.cookies.password){
    res.render('chat', {
      jid: req.cookies.jid,
      password: req.cookies.password});
  }else{
    res.render("index",{});
  }

});

router.post("/", function(req,res,next){
  var userDomain=req.body.domain || domain;
  res.cookie("jid",req.body.username + "@" + userDomain);
  res.cookie("password",req.body.password);
  req.app.locals.res=res;
  req.app.locals.req=req;
  res.render('chat', {
    jid: req.body.username + "@" + userDomain,
    password: req.body.password,
    host: req.body.host,
    domain: userDomain,
    port: req.body.port
  });
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
  var imageRegEx=/\.(jpg|gif|png)$/;
  var filename=req.params.filename;
  var file = __dirname + '/files/'+req.params.filename;
  if (imageRegEx.test(filename)){
    res.sendFile(file)
  }else{
    res.download(file);
  }

  // Set
});

module.exports = router;
