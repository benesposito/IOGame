var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/../client'));

var users = [];
var config = {
    width: 50,
    height: 50,
    speed: 5
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
            x: Math.floor(Math.random() * (1500/*data.screenWidth*/ - config.width) / config.width) * config.width,
            y: Math.floor(Math.random() * (600/*data.screenHeight*/ - config.height) / config.height) * config.height,
            screenWidth: 1500,//data.screenWidth,
            screenHeight: 600,//data.screenHeight,
            color: color,
            direction: 'NONE',
            pendingDirection: 'NONE'
        };

        users.push(currentPlayer);
        console.log(users.length);

        socket.emit('startGame');
    });

    socket.on('movement', function(direction) {
        if(direction != 'SAME')
            currentPlayer.pendingDirection = direction;
    });

    socket.on('disconnect', function() {
        console.log('User disconnected.');
        console.log(users.length);

        users.splice(users.indexOf(currentPlayer), 1);

        io.sockets.emit('playerDisconnected', users);
    });
});

var loop = setInterval(function() {
    for(i in users) {
        var u = users[i];

        if(u.pendingDirection != 'NONE') {
            switch(u.pendingDirection) {
                case 'UP':
                case 'DOWN':
                    if(u.x % config.width == 0)
                        u.direction = u.pendingDirection;
                    break;
                case 'LEFT':
                case 'RIGHT':
                    if(u.y % config.height == 0)
                        u.direction = u.pendingDirection;
                    break;
            }
        }

        switch(u.direction) {
            case 'UP':
                if(u.y >= config.speed)
                    u.y -= config.speed;
                break;
            case 'LEFT':
                if(u.x >= config.speed)
                    u.x -= config.speed;
                break;
            case 'DOWN':
                if(u.y <= 600 - config.speed - config.height)
                    u.y += config.speed;
                break;
            case 'RIGHT':
                if(u.x <= 1500 - config.speed - config.width)
                    u.x += config.speed;
                break;
        }
    }

    io.sockets.emit('updateUsers', users);
}, 50.0 / 3.0);

http.listen(3000, function() {
    console.log('The server is listening on port 3000');
});
