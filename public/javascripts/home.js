// connect to the socket server
//$(document).ready(function(){
console.log("here");
//});

var socket = io.connect();

// if we get an "info" emit from the socket server then console.log the data we recive
socket.on('info', function (data) {
    console.log(data);
});

socket.on('session_started', function (data) {
    console.log('session_started');
    console.log(data);
});

socket.on('joined_session', function (data) {
    console.log('joined_session');
    console.log(data);
});

socket.on('new_user_joined', function (data) {
    console.log('new_user_joined');
    console.log(data);
});

socket.on('get_location', function (data) {
    console.log('received location update');
    console.log(data);
});

function startSession(data) {
    socket.emit('start_session', data);
}

function joinSession(data) {
    socket.emit('join_session', data);
}

function updateLocation(data) {
    socket.emit('update_location', data);
}