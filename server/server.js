var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/../client'));

var config = {
    refreshRate: 16, //16
    sideLength: 20,
    speed: 4,
    numXTiles: 80,
    numYTiles: 45,
    get width() { return this.sideLength * this.numXTiles; },
    get height() { return this.sideLength * this.numYTiles; },
    food: 25,
    get cycleLength() { return this.sideLength / this.speed; }
};

var users = [];
var food = [];

for(i = 0; i < config.food; i++)
    food.push(getRandomTile());

io.on('connection', function(socket) {
    console.log('User connected!');

    socket.emit('initialServerInfo', config, users);
    var player;

    socket.on('client info', function(data) { //Eventually make this only define the things not defined in spawn(), and then call spawn(player)
        player = {
            id: socket.id,
            x: Math.floor(Math.random() * (config.width - config.sideLength) / config.sideLength) * config.sideLength,
            y: Math.floor(Math.random() * (config.height - config.sideLength) / config.sideLength) * config.sideLength,
            get head() {
                switch(this.direction) {
                    case 'LEFT':
                    case 'UP':
                        return p2t(this.x, this.y);
                    case 'RIGHT':
                        return p2t(this.x + config.sideLength - config.speed, this.y);
                    case 'DOWN':
                        return p2t(this.x, this.y + config.sideLength - config.speed);
                    default:
                        return p2t(0, 0);
                }
             },
            screenWidth: data.screenWidth,
            screenHeight: data.screenHeight,
            color: getRandomColor(),
            direction: 'DOWN',
            pendingX: 'NONE',
            pendingY: 'NONE',
            size: 3,
            tiles: [p2t(this.x, this.y)]
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

var cycle = 0;
var loop = setInterval(function() {

    for(i in users) {
        var u = users[i];
        var prevHead = Object.assign({}, u.head);

        handleControls(u);
        handleFood(u);

        if(!tilesEqual(u.head, prevHead)) {
            cycle = 0;
            updatePosition(u);
        }
    }

    io.sockets.emit('serverData', {
        users: users,
        food: food,
        cycle: cycle
    });

    cycle++;
}, config.refreshRate);

function p2t(x, y) { //pixel to tile
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

function handleFood(u) {
    for(f in food) {
        if(tilesEqual(u.head, food[f])) {
            food.splice(f, 1);
            food.push(getRandomTile());
            u.size++;
        }
    }
}

function updatePosition(u) {
    u.tiles.splice(0, 1); //removes first element in the array, which represents the "tail"

    if(u.tiles.length < u.size) {
        u.tiles.unshift(u.tiles[0]);
    }

    u.tiles.push(u.head); //adds the "head" to the end of the array
}

function getRandomTile() {
    return {
        x: Math.floor(Math.random() * config.width / config.sideLength),
        y: Math.floor(Math.random() * config.height / config.sideLength)
    };
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

function spawn(u) {
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
