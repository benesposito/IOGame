var socket = io.connect('http://localhost:3000');
//var socket = io.connect('73.10.25.154:3000');

var users = [];
var food = [];
var player;
var config;

var canvas = document.getElementById('canvas');
var c = canvas.getContext('2d');

socket.on('connect', function() {
    console.log('Connected!');

    socket.on('initialServerInfo', function(configServer, usersServer) {
        config = configServer;
        users = usersServer;

        for(i in users)
            if(users[i].id == socket.id)
                player = users[i];

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
        food = data.food;

        for(i in users) {
            if(users[i].id == socket.id)
                player = users[i];
        }
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

        for(j in u.tiles) {
            var t = u.tiles[j];

            c.fillRect(t[0], t[1], config.sideLength, config.sideLength);
        }
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

    for(i in food) {
        var f = food[i];

        c.fillStyle = '#FF0000'; //red
        c.fillRect(t2p(f).x, t2p(f).y, config.sideLength, config.sideLength);
    }
}

function t2p(t) {
    return {
        x: t[0] * config.sideLength,
        y: t[1] * config.sideLength
    };
}

document.addEventListener('keydown', function(event) {
    var directionX;
    var directionY;

    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            directionY = 'UP';
            directionX = 'SAME';
            break;
        case 'ArrowLeft':
        case 'KeyA':
            directionX = 'LEFT';
            directionY = 'SAME';
            break;
        case 'ArrowDown':
        case 'KeyS':
            directionY = 'DOWN';
            directionX = 'SAME';
            break;
        case 'ArrowRight':
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

function hexToRgbA(hex, alpha){ //copied from https://stackoverflow.com/questions/21646738/convert-hex-to-rgba, very slightly modified
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',' + alpha + ')';
    }
    throw new Error('Bad Hex');
}

function getRandomColor() {
    var color = '#';
    var values = '0123456789ABCDEF';

    for(i = 0; i < 6; i++)
        color += values.charAt(Math.floor(Math.random() * 16));

    return color;
}
