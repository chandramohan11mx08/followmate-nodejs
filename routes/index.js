var express = require('express');
var router = express.Router();
var registerUser = require('./register-user');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/register-user',function(req,res,next){
    registerUser.registerUser(req,res);
});

module.exports = router;
