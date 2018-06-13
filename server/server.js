var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/../client'));

var users = [];
var config = {
    width: 50,
    height: 50
};

io.on('connection', function(socket) {
    console.log('User connected!');

    socket.emit('initialServerInfo', config, users);
    var currentPlayer;

    socket.on('client info', function(data) {
        var color = '#';
        var values = '0123456789ABCDEF';

        for(i = 0; i < 6; i++)
            color += values.charAt(Math.floor(Math.random() * 16));

        currentPlayer = {
            id: socket.id,
            x: 10 + Math.random() * (1500/*data.screenWidth*/ - config.width - 10),
            y: 10 + Math.random() * (600/*data.screenHeight*/ - config.height - 10),
            screenWidth: 1500,//data.screenWidth,
            screenHeight: 600,//data.screenHeight,
            color: color
        };

        users.push(currentPlayer);

        console.log(users.length);

        socket.emit('startGame');
    });

    socket.on('movement', function(direction) {
        if(direction != 'SAME')
            currentPlayer.direction = direction;
    });

    socket.on('disconnect', function() {
        console.log('User disconnected.');

        users.splice(users.indexOf(currentPlayer), 1);

        io.sockets.emit('playerDisconnected', users);
    });
});

var loop = setInterval(function() {
    for(i in users) {
        var u = users[i];

        var speed = 5;

        switch(u.direction) {
            case 'UP':
                if(u.y >= speed)
                    u.y -= speed;
                break;
            case 'LEFT':
                if(u.x >= speed)
                    u.x -= speed;
                break;
            case 'DOWN':
                if(u.y <= 600 - speed - config.height)
                    u.y += speed;
                break;
            case 'RIGHT':
                if(u.x <= 1500 - speed - config.width)
                u.x += speed;
                break;
        }
    }

    io.sockets.emit('updateUsers', users);
}, 50.0 / 3.0);

http.listen(3000, function() {
    console.log('The server is listening on port 3000');
});
