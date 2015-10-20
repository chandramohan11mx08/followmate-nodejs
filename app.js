var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHandlebars = require('express-handlebars');
var session = require('./routes/session');

var routes = require('./routes/index');

var app = express();

app.engine('.hbs', expressHandlebars({
//    defaultLayout: 'index',
    extname: '.hbs',
    layoutsDir: 'views'
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');
app.set('port', '6610');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var http = require('http').Server(app);
var io = require('socket.io').listen(http);

io.sockets.on('connection', function (socket) {
    console.log('A new user connected!');

    socket.on('start_session', function (data) {
        session.createNewSession(data).then(function (sessionData) {
            if (sessionData.is_session_created) {
                socket.join(sessionData.session_id);
            }
            socket.emit('session_started', sessionData);
        });
    });

    socket.on('join_session', function (data) {
        session.addNewParticipant(data.session_id, data.user_id).then(function (isAdded) {
            if (isAdded) {
                socket.join(data.session_id);
                socket.emit('joined_session', { joined: true});
                socket.broadcast.to(data.session_id).emit('new_user_joined', 'User ' + data.user_id + " has joined");
            }else{
                socket.emit('joined_session', { joined: false});
            }
        });
    });

    socket.on('update_location', function (data) {
        socket.broadcast.to(data.session_id).emit('get_location','User '+data.user_id+" has updated location "+data.location);
    });

    socket.on('chat_message', function (msg) {
        console.dir(msg+" from "+socket.id);
        socket.broadcast.emit('chat_received', { msg: msg});
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

http.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

//module.exports = app;
