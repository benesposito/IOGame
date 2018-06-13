var socket = io.connect('http://localhost:3000');
//var socket = io.connect('73.10.25.154:3000');

var users = [];
var player;
var config;

var canvas = document.getElementById('canvas');
canvas.width = 1500;//window.innerWidth;
canvas.height = 600;//window.innerHeight;
var c = canvas.getContext('2d');

socket.on('connect', function() {
    console.log('Connected!');

    socket.on('initialServerInfo', function(configServer, usersServer) {
        config = configServer;
        users = usersServer;
    })

    socket.emit('client info', {
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
    });

    socket.on('startGame', function() {
        animate();
    });

    socket.on('updateUsers', function(usersServer) {
        users = usersServer;
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
        c.fillRect(u.x, u.y, config.width, config.height);
    }

    c.strokeStyle = "#999999";

    for(i = 0; i < 1500; i += config.width) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i, 600);
        c.stroke();
    }

    for(i = 0; i < 600; i += config.height) {
        c.beginPath();
        c.moveTo(0, i);
        c.lineTo(1500, i);
        c.stroke();
    }
}

document.addEventListener('keydown', function(event) {
    var direction;

    switch(event.code) {
        case 'KeyW':
            direction = 'UP';
            break;
        case 'KeyA':
            direction = 'LEFT';
            break;
        case 'KeyS':
            direction = 'DOWN';
            break;
        case 'KeyD':
            direction = 'RIGHT';
            break;
        default:
            direction = 'SAME';
    }

    console.log(direction);

    socket.emit("movement", direction);
});
