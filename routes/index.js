var express = require('express');
var router = express.Router();
var registerUser = require('./user');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/user/register',function(req,res,next){
    registerUser.registerUser(req,res);
});

module.exports = router;
