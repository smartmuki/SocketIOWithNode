var express = require('express'),
		app = express(),
		http = require('http').createServer(app),
		bodyParser = require('body-parser'),
		_ = require("underscore"),
		io = require("socket.io").listen(http);
	

var participants = [];
	
//app.set("ipaddr", "127.0.0.1");
app.set("port", process.env.PORT || 1337);

app.set("views", __dirname + "/views");
app.set("view engine", "jade");

app.use(express.static("public", __dirname + "/public"));

app.use(bodyParser.json());

app.get("/", function(request, response) {
	response.render("index");
});

app.post('/message', function(request, response) {
	var message = request.body.message;
	if(_.isUndefined(message) || _.isEmpty(message.trim())) {
		return response.json(400, {error: 'Message is invalid'}); 
	}
	
	var senderName = request.body.name;
	
	io.sockets.emit('incomingMessage', {message: message, name: senderName });
	
	response.json(200, {message: 'Message received'});
});

io.on("connection", function(socket) {
	socket.on("newUser", function(data) {
		participants.push({id:data.id, name: data.name});
		io.sockets.emit("newConnection", {participants: participants});
	});
	
	socket.on("nameChange", function(data) {
		_.findWhere(participants, {id: data.id}).name = data.name;
		io.sockets.emit("nameChanged", {id:data.id, name:data.name})
	});
	
	socket.on("disconnect", function() {
		participants = _.without(participants, _.findWhere(participants, {id: socket.id}));
		io.sockets.emit("userDisconnected", {id:socket.id, sender: "system"});
	});
});

http.listen(app.get("port"));

//http.listen(app.get("port"), function() {
//	console.log("server is up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
//});