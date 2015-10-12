var shortIdHelper = require('./helpers/shortid-helper');
var mongoDbHelper = require('./helpers/mongo-helper');

var sendResponse = function (res, isUserCreated, message) {
    res.send({'is_user_created': isUserCreated, 'msg': message});
};

function getUserObject(userId, mobileNumber) {
    var document = {'user_id': userId,
        'mobile_number': mobileNumber,
        'is_verified': false,
        'timestamp': Date.now()};
    return document;
}
var registerUser = function (req, res) {
    var data = req.body;
    console.dir(data);
    var mobileNumber = data.mobile_number;
    if (mobileNumber.length < 10) {
        sendResponse(res, false, 'Invalid mobile number');
    } else {
        mongoDbHelper.isDocumentExists('user', {'mobile_number': mobileNumber}).then(function (isExists) {
            if (isExists) {
                sendResponse(res, false, 'Mobile number already exists');
            } else {
                getNewUserId().then(function (response) {
                    if (response.status) {
                        var document = getUserObject(response.user_id, mobileNumber);
                        mongoDbHelper.insertDocument('user', document).then(function (result) {
                            sendResponse(res, true, 'User created with id ' + response.user_id);
                        });
                    }
                });
            }
        }).catch(function (e) {
                sendResponse(res, false, 'Something went wrong');
            });
    }
};

var getNewUserId = function () {
    var shortId = shortIdHelper.getShortId();
    return mongoDbHelper.isDocumentExists('user', {'user_id': shortId}).then(function (isExists) {
        if (isExists) {
            getNewUserId();
        } else {
            console.log("user id created " + shortId);
            return {"status": true, "user_id": shortId};
        }
    });
};

exports.registerUser = registerUser;