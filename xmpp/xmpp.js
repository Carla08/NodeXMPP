//Requires the node module of xmpp client.
var Client = require("node-xmpp-client");

//vars for initialization.
var host = "52.37.160.103";
var domain = "@localhost";
var port = 5222;

//Var for session
//var logged = false;

//Set for connection 
var client;

module.exports ={
	login: function (user,password) {
		var client = new Client({
			jid: user + domain,
			password: password,
			host: host,
			port: port
		});
		client.send(new Client.Stanza("presence", {"type": "available"})
			.c("show").t("chat").up()
			.c("status").t("Hi I am here stanzas"));
		client.on("online", function (data) {
			console.log("online");
			//logged = true;
			//THIS NEEDS A FIX. it goes here for the asyncronity of Node.js
			sendMessage("carla@localhost", "sup from Node");
		});
		
	},
	sendMessage:function (to, msg){
		//while (logged === false) {;}
		console.log("entered the send message");
		var stanza = new Client.Stanza("message", {to: to, type: "chat"}).c("body").t(msg);
		client.send(stanza);
	}
};
test();