var express = require('express');
var router = express.Router();
var registerUser = require('./user');
var sessionHandler = require('./session')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/user/register',function(req,res,next){
    registerUser.registerUser(req,res);
});

router.post('/user/contacts',function(req,res,next){
    registerUser.getUserContacts(req,res);
});

router.post('/session/drop', function (req, res, next) {
    sessionHandler.dropUserFromSession(req, res);
});

router.post('/session/start', function (req, res, next) {
    sessionHandler.startSession(req, res);
});

router.post('/session/join', function (req, res, next) {
    sessionHandler.joinSession(req, res);
});

router.post('/session/end', function (req, res, next) {
    var session_id = req.body.session_id;
    var user_id = req.body.user_id;
    sessionHandler.endUserSession(session_id, user_id).then(function (response) {
        if(response.err){
            res.status(500);
            res.send(response);
        }else{
            res.send(response);
        }
    });
});

module.exports = router;
