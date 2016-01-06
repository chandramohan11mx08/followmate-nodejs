var shortIdHelper = require('./helpers/shortid-helper');
var mongoDbHelper = require('./helpers/mongo-helper');

var MOBILE_NUMBER_EXISTS = 'Mobile number already exists';
var INVALID_MOBILE_NUMBER = 'Invalid mobile number';
var ERROR_UNKNOWN = 'Something went wrong';

var USER_COLLECTION = "user";

var sendResponse = function (res, isUserCreated, isVerificationRequired, message, userId, mobileNumber) {
    var code = null;
    if (isVerificationRequired) {
        code = shortIdHelper.getShortId();
    }
    var responseData = {'is_user_created': isUserCreated, 'msg': message, 'user_id': userId, 'mobile_number': mobileNumber, "isVerificationRequired": isVerificationRequired, "code": code};
    res.send(responseData);
};

function getUserObject(userId, mobileNumber, deviceId) {
    var document = {'user_id': userId,
        'is_active': true,
        'mobile_number': mobileNumber,
        'device_id': deviceId,
        'is_verified': false,
        'timestamp': Date.now()};
    return document;
}
var registerUser = function (req, res) {
    var data = req.body;
    var mobileNumber = data.mobile_number;
    var deviceId = data.device_id;
    if (mobileNumber.length < 10) {
        sendResponse(res, false, false, INVALID_MOBILE_NUMBER, null, mobileNumber);
    } else {
        mongoDbHelper.isDocumentExists(USER_COLLECTION, {'mobile_number': mobileNumber}).then(function (isExists) {
            if (isExists) {
                mongoDbHelper.findOneDocument(USER_COLLECTION,{'mobile_number': mobileNumber}).then(function(document){
                    sendResponse(res, false, true, MOBILE_NUMBER_EXISTS, document.user_id, mobileNumber);
                });
            } else {
                getNewUserId().then(function (response) {
                    if (response.status) {
                        var document = getUserObject(response.user_id, mobileNumber, deviceId);
                        mongoDbHelper.insertDocument(USER_COLLECTION, document).then(function (result) {
                            sendResponse(res, true, true, "", response.user_id, mobileNumber);
                        });
                    }
                });
            }
        }).catch(function (e) {
                sendResponse(res, false, false, ERROR_UNKNOWN, null, mobileNumber);
            });
    }
};

var getNewUserId = function () {
    var shortId = shortIdHelper.getShortId();
    return mongoDbHelper.isDocumentExists(USER_COLLECTION, {'user_id': shortId}).then(function (isExists) {
        if (isExists) {
            getNewUserId();
        } else {
            return {"status": true, "user_id": shortId};
        }
    });
};

exports.registerUser = registerUser;