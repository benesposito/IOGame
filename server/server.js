var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/../client'));

var config = {
    sideLength: 20,
    speed: 4,
    numXTiles: 60,
    numYTiles: 40,
    get width() { return this.sideLength * this.numXTiles; },
    get height() { return this.sideLength * this.numYTiles; },
    food: 8
};

var users = [];
var food = [];

for(i = 0; i < config.food; i++)
    food.push(getRandomTile());

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
            tiles: [[this.x, this.y]]
        };

        users.push(player);

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

        handleControls(u);
        handleFoodAndMovement(u);

        var head = p2t(u.x, u.y);

        for(j in users) {
            var u2 = users[j];

            if(u === u2) {
                for(tile = 0; tile < u2.tiles.length - 3 * config.speed; tile += 1) {
                    if(tilesEqual(head, p2t(u2.tiles[tile][0], u2.tiles[tile][1])))
                        kill(u);
                }
            } else {

                for(tile = 0; tile < u2.tiles.length; tile += 1) {
                    if(tilesEqual(head, p2t(u2.tiles[tile][0], u2.tiles[tile][1])))
                        kill(u);
                }
            }
        }
    }

    io.sockets.emit('serverData', {
        users: users,
        food: food
    });
}, 50.0 / 3.0); //50.0 / 3.0

function p2t(x, y) {
    return {
        x: Math.floor(x / config.sideLength),
        y: Math.floor(y / config.sideLength)
    };
}

function handleControls(u) {
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

function handleFoodAndMovement(u) {
    for(f in food) {
        var pos = p2t(u.x, u.y);

        if(arraysEqual([pos.x, pos.y], food[f])) {
            food.splice(f, 1);
            food.push(getRandomTile());

            for(j = 0; j < config.sideLength / config.speed; j++)
                u.tiles.unshift(u.tiles[0]);
        }
    }

    u.tiles.splice(0, 1);

    u.tiles.push([u.x, u.y]);
}

function getRandomTile() {
    return [Math.floor(Math.random() * config.width / config.sideLength), Math.floor(Math.random() * config.height / config.sideLength)]
}

function arraysEqual(arr1, arr2) { //copied from https://stackoverflow.com/questions/4025893/how-to-check-identical-array-in-most-efficient-way
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}

function tilesEqual(t1, t2) {
    if(t1.x == t2.x && t1.y == t2.y)
        return true;

    return false;
}

function kill(u) {
    u.x = Math.floor(Math.random() * (config.width - config.sideLength) / config.sideLength) * config.sideLength;
    u.y = Math.floor(Math.random() * (config.height - config.sideLength) / config.sideLength) * config.sideLength;
    u.color = getRandomColor();
    u.direction = 'DOWN';
    u.pendingX = 'NONE';
    u.pendingY = 'NONE';
    u.tiles = [[u.x, u.y]];
}

function getRandomColor() {
    var color = '#';
    var values = '0123456789ABCDEF';

    for(i = 0; i < 6; i++)
        color += values.charAt(Math.floor(Math.random() * 16));

    return color;
}

http.listen(3000, function() {
    console.log('The server is listening on port 3000');
});
