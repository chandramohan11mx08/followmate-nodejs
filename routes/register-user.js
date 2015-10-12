var shortIdHelper = require('./helpers/shortid-helper');
var mongoDbHelper = require('./helpers/mongo-helper');
var async = require('async');


var generateCookieId = function (req, res) {
    var shortId = shortIdHelper.getShortId();
    console.log(shortId);
    res.send({"cookie_id": shortId});
};

var sendResponse = function (res, isUserCreated, message) {
    res.send({'is_user_created': isUserCreated, 'msg': message});
};

var registerUser = function (req, res) {
    var data = req.body;
    console.dir(data);
    var mobileNumber = data.mobile_number;
    if (mobileNumber.length < 10) {
        sendResponse(res, false, 'Invalid mobile number');
    } else {
        mongoDbHelper.isDocumentExists('user', {'mobile_number': mobileNumber}, function (err, isExists) {
            if (err) {
                sendResponse(res, false, 'Something went wrong');
            } else {
                if (isExists) {
                    sendResponse(res, false, 'Mobile number already exists');
                } else {
                    getNewUserId(function (isUserIdCreated, userId) {
                        if (isUserIdCreated) {
                            var document = {'user_id': userId,
                                'mobile_number': mobileNumber,
                                'is_verified': false,
                                'timestamp': Date.now()};
                            mongoDbHelper.insertDocument('user', document, function (err, result) {
                                if (err) {
                                    sendResponse(res, false, 'Unable to create user');
                                } else {
                                    sendResponse(res, true, 'User created with id ' + userId);
                                }
                            })
                        } else {
                            sendResponse(res, false, 'Unable to create user');
                        }
                    });
                }
            }
        });
    }
};

var getNewUserId = function (callBack) {
    var shortId = shortIdHelper.getShortId();
    mongoDbHelper.isDocumentExists('user', {'user_id': shortId}, function (err, isExists) {
        if (err) {
            callBack(false, null);
        } else {
            if (isExists) {
                getNewUserId(callBack);
            } else {
                console.log("user id created "+shortId);
                callBack(true, shortId);
            }
        }
    });
};

exports.registerUser = registerUser;