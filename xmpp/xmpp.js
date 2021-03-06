//Requires the node module of xmpp client.
var Client = require("node-xmpp-client");

//vars for initialization.
//var domain = "@cml.chi.itesm.mx";
//var domain = "@localhost";
var domain="cml.chi.itesm.mx";
var port = 5222;
//var host = "52.37.160.103";

//Var for session
//var logged = false;

//Set for connection 
var client;

module.exports ={
	login: function (user,password, io,cb) {
		client = new Client({
			jid: user+"@"+domain,
			password: password,
			host:domain,
			port: port
		});
		client.send(new Client.Stanza("presence", {"type": "available"})
			.c("show").t("chat").up()
			.c("status").t("Hi I am here stanzas"));
		client.on("online", function (data) {
			console.log("online");

			//module.exports.sendMessage(carla+"@"+domain, "sup from Node");
			cb(client.jid);
		});
		client.on("stanza", function (stanza) {
			if (stanza.is('message')){
				io.sockets.emit("chat message",stanza.getChildText('body').toString());
			}
		});

	},sendMessage:function (to, msg){
		//while (logged === false) {;}
		console.log("Entered the send message");
		var stanza = new Client.Stanza("message", {to: to, type: "chat"}).c("body").t(msg);
		client.send(stanza);
	}, logOff: function () {
		console.log("Logged Off");
		 
	}

};