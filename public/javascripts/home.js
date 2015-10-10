// connect to the socket server
//$(document).ready(function(){
    console.log("here");
//});

var socket = io.connect();

// if we get an "info" emit from the socket server then console.log the data we recive
socket.on('info', function (data) {
    console.log(data);
});

socket.on('chat_received', function (data) {
    console.log(data.msg);
});

function sendMessage(text){
    socket.emit('chat_message',{msg:text});
}
