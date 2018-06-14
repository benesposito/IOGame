var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const Tile = require('./tile.js');

app.use(express.static(__dirname + '/../client'));

var config = {
    sideLength: 20,
    speed: 4,
    numXTiles: 40,
    numYTiles: 20,
    get width() { return this.sideLength * this.numXTiles; },
    get height() { return this.sideLength * this.numYTiles; }
};

var users = [];
var tiles = new Array(config.numXTiles);

for(x = 0; x < config.numXTiles; x++) {
    tiles[x] = new Array(config.numYTiles);

    for(y = 0; y < config.numYTiles; y++)
        tiles[x][y] = new Tile(x, y);
}

io.on('connection', function(socket) {
    console.log('User connected!');

    socket.emit('initialServerInfo', config, users);
    var player;

    socket.on('client info', function(data) {
        var color = '#';
        var values = '0123456789ABCDEF';

        for(i = 0; i < 6; i++)
            color += values.charAt(Math.floor(Math.random() * 16));

        player = {
            id: socket.id,
            x: Math.floor(Math.random() * (config.width - config.sideLength) / config.sideLength) * config.sideLength,
            y: Math.floor(Math.random() * (config.height - config.sideLength) / config.sideLength) * config.sideLength,
            screenWidth: data.screenWidth,
            screenHeight: data.screenHeight,
            color: color,
            direction: 'DOWN',
            pendingX: 'NONE',
            pendingY: 'NONE',
            path: [],
            ownedTiles: []
        };

        player.ownedTiles = [
                [player.x - 1, player.y - 1],   [player.x, player.y - 1],   [player.x + 1, player.y - 1],
                [player.x - 1, player.y],       [player.x, player.y],       [player.x + 1, player.y],
                [player.x - 1, player.y + 1],   [player.x, player.y + 1],   [player.x + 1, player.y + 1]
        ];

        users.push(player);
        console.log(users.length);

        socket.emit('startGame');
    });

    socket.on('movement', function(directionX, directionY) {
        if(directionX != 'SAME' && (player.direction != directionX || player.pendingY != 'NONE'))
            player.pendingX = directionX;
        if(directionY != 'SAME' && (player.direction != directionY || player.pendingX != 'NONE'))
            player.pendingY = directionY;
    });

    socket.on('disconnect', function() {
        console.log('User disconnected.');
        console.log(users.length);

        users.splice(users.indexOf(player), 1);

        io.sockets.emit('playerDisconnected', users);
    });
});

var loop = setInterval(function() {
    for(i in users) {
        var u = users[i];

        handleMovement(u);

        var t = p2t(u.x, u.y);

        t.setOwner(u);
    }

    io.sockets.emit('serverData', {
        users: users,
        tiles: tileArrayGetData(tiles)
    });
}, 50.0 / 3.0); //50.0 / 3.0

function p2t(x, y) {
    return tiles[Math.floor(x / config.sideLength)][Math.floor(y / config.sideLength)];
}

function tileArrayGetData(arr) {
    var arr2 = new Array(config.numXTiles);

    for(x in arr) {
        arr2[x] = new Array(config.numYTiles);

        for(y in arr[x])
            arr2[x][y] = arr[x][y].getData();
    }

    return arr;
}

function handleMovement(u) {
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

http.listen(3000, function() {
    console.log('The server is listening on port 3000');
});
