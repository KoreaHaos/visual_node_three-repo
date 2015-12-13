var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

/*
This is where i figured out how to get and store input from the server.
*/
function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
    console.log("broadcast() called! event.toString() = " + event.toString());
    console.log("broadcast() called! data.toString() = " + data.toString());
    if(event.toString() == "message") {
      console.log("(event.toString() == \"message\") is true !)");
      console.log("data.text.toString() = " + data.text.toString());
      passWordToDisplay(data.text.toString());
    } else {
      console.log("(event.toString() == \"message\") is false :(");
    }
  });
}

// And here is where i figure out how to save it so it can be used by my sketch.

function passWordToDisplay(stringToPass) {
  console.log("passWordToDisplay() called, stringToPass = " + stringToPass);
  var fileWrityThingy = require('fs');
  fileWrityThingy.writeFile("/home/ubuntu/workspace/client/processing/data/test1.txt", "Hey there!", function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
}); 
}


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
