var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/../client'));

var config = {
    sideLength: 50,
    speed: 5,
    numXTiles: 20,
    numYTiles: 10,
    get width() { return this.sideLength * this.numXTiles; },
    get height() { return this.sideLength * this.numYTiles; }
};

var users = [];
/*var tiles = new Array(config.numXTiles);

for(x = 0; x < config.numXTiles; x++) {
    tiles[x] = new Array(config.numYTiles);

    for(y = 0; y < config.numYTiles; y++)
        tiles[x][y] = 1;// new Tile(x, y);
}
*/ var tiles = [];


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
            x: Math.floor(Math.random() * (config.width - config.sideLength) / config.sideLength) * config.sideLength,
            y: Math.floor(Math.random() * (config.height - config.sideLength) / config.sideLength) * config.sideLength,
            screenWidth: data.screenWidth,
            screenHeight: data.screenHeight,
            color: color,
            direction: 'DOWN',
            pendingX: 'NONE',
            pendingY: 'NONE',
            path: []
        };

        users.push(currentPlayer);
        console.log(users.length);

        socket.emit('startGame');
    });

    socket.on('movement', function(directionX, directionY) {
        if(directionX != 'SAME' && (currentPlayer.direction != directionX || currentPlayer.pendingY != 'NONE'))
            currentPlayer.pendingX = directionX;
        if(directionY != 'SAME' && (currentPlayer.direction != directionY || currentPlayer.pendingX != 'NONE'))
            currentPlayer.pendingY = directionY;
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
        var xChanged = false;

        if(u.pendingX != 'NONE') {
            if(u.direction == 'UP' || u.direction == 'DOWN') {
                if(u.y % config.sideLength == 0) {
                    u.direction = u.pendingX;
                    u.pendingX = 'NONE';
                    xChanged = true;
                }
            }
        }

        if(!xChanged && u.pendingY != 'NONE') {
            if(u.direction == 'LEFT' || u.direction == 'RIGHT') {
                if(u.x % config.sideLength == 0) {
                    u.direction = u.pendingY;
                    u.pendingY = 'NONE';
                }
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
                if(u.y <= config.height - config.speed - config.sideLength)
                    u.y += config.speed;
                break;
            case 'RIGHT':
                if(u.x <= config.width - config.speed - config.sideLength)
                    u.x += config.speed;
                break;
        }
    }

    io.sockets.emit('serverData', {
        users: users,
        tiles: tiles
    });
}, 50.0 / 3.0); //50.0 / 3.0

http.listen(3000, function() {
    console.log('The server is listening on port 3000');
});
