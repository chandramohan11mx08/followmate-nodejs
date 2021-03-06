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
        if (data.user_id == null) {
            socket.emit('session_started', session.sendResponse(false, null, "Unknown user"));
        } else {
            session.createNewSession(data).then(function (sessionData) {
                if (sessionData.is_session_created) {
                    socket.join(sessionData.session_id);
                }
                socket.emit('session_started', sessionData);
            });
        }
    });

    socket.on('join_session', function (data) {
        console.log("trying to join");
        console.dir(data);
        if (data.user_id == null || data.session_id == null) {
            socket.emit('joined_session', { joined: false});
            console.log("failed");
        } else {
            session.addNewParticipant(data).then(function (response) {
                if (response.isAdded) {
                    socket.join(data.session_id);
                    socket.emit('joined_session', { joined: true, session_id: data.session_id, participants: response.participants});
                    socket.broadcast.to(data.session_id).emit('new_user_joined', {user_id: data.user_id, session_id: data.session_id, userLocation: data.user_location,visibility:data.visibility});
                } else {
                    socket.emit('joined_session', { joined: false, participants:[]});
                }
            });
        }
    });

    socket.on('rejoin_session', function (data) {
        if (data.user_id == null || data.session_id == null) {
            socket.emit('rejoined', { joined: false});
        } else {
            session.setParticipantOnlineStatus(data.session_id, data.user_id, true).then(function (statusChanged) {
                if (statusChanged) {
                    session.getSession(data.session_id).then(function(sessionData){
                        socket.join(data.session_id);
                        console.log("rejoined session " + data.session_id);
                        socket.emit('rejoined', { joined: true, participants:sessionData.participants});
                        socket.broadcast.to(data.session_id).emit('user_rejoined', {user_id: data.user_id});
                    });
                } else {
                    socket.emit('rejoined', { joined: false});
                }
            });
        }
    });

    socket.on('change_visibility', function (data) {
        session.setParticipantVisibility(data.session_id, data.user_id, data.visibility).then(function (statusChanged) {
            if (statusChanged) {
                console.log("visibility changed by " + data.user_id);
                socket.broadcast.to(data.session_id).emit('visibility_changed', {session_id: data.session_id, user_id: data.user_id, visibility: data.visibility});
            }
        });
    });

    socket.on('update_location', function (data) {
        socket.broadcast.to(data.session_id).emit('get_location','User '+data.user_id+" has updated location "+data.location);
    });

    socket.on('share_location', function (data) {
        socket.broadcast.to(data.session_id).emit('user_location', data);
    });

    socket.on('end_session', function (data) {
        session.endUserSession(data.session_id, data.user_id).then(function (response) {
            if (response.terminated) {
                socket.emit('terminated', { success: true});
                socket.broadcast.to(data.session_id).emit('user_end_session', {session_id: data.session_id, user_id: data.user_id, visibility: data.visibility});
            }else{
                socket.emit('terminated', { success: false});
            }
        });
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    setTimeout(sendHeartbeat,7000);

    function sendHeartbeat(){
        setTimeout(sendHeartbeat, 7000);
        io.sockets.emit('ping', { beat : 1 });
    }
});

http.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

//module.exports = app;
