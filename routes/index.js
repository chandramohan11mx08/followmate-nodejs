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

router.post('/session/drop', function (req, res, next) {
    sessionHandler.dropUserFromSession(req, res);
});

module.exports = router;
