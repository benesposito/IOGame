var socket = io.connect('http://localhost:3000');
//var socket = io.connect('73.10.25.154:3000');

var users = [];
var tiles = [];
var player;
var config;

var canvas = document.getElementById('canvas');
var c = canvas.getContext('2d');

socket.on('connect', function() {
    console.log('Connected!');

    socket.on('initialServerInfo', function(configServer, usersServer) {
        config = configServer;
        users = usersServer;
        
        canvas.width = config.width;
        canvas.height = config.height;
    })

    socket.emit('client info', {
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
    });

    socket.on('startGame', function() {
        animate();
    });

    socket.on('serverData', function(data) {
        users = data.users;
        tiles = data.tiles;
    });

    socket.on('playerDisconnected', function(userList) {
        users = userList;
    });
});

function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for(i in users) {
        var u = users[i];
        c.fillStyle = u.color;
        c.fillRect(u.x, u.y, config.sideLength, config.sideLength);
    }

    c.strokeStyle = "#999999";

    for(i = 0; i < config.width; i += config.sideLength) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i, config.height);
        c.stroke();
    }

    for(i = 0; i < config.height; i += config.sideLength) {
        c.beginPath();
        c.moveTo(0, i);
        c.lineTo(config.width, i);
        c.stroke();
    }
}

document.addEventListener('keydown', function(event) {
    var directionX;
    var directionY;

    switch(event.code) {
        case 'KeyW':
            directionY = 'UP';
            directionX = 'SAME';
            break;
        case 'KeyA':
            directionX = 'LEFT';
            directionY = 'SAME';
            break;
        case 'KeyS':
            directionY = 'DOWN';
            directionX = 'SAME';
            break;
        case 'KeyD':
            directionX = 'RIGHT';
            directionY = 'SAME';
            break;
        default:
            directionX = 'SAME';
            directionY = 'SAME';
    }


    socket.emit("movement", directionX, directionY);
});
