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
    console.log(data);
});

function sendMessage(data){
    socket.emit('start_session',data);
}
