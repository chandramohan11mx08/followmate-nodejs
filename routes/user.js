var shortIdHelper = require('./helpers/shortid-helper');
var mongoDbHelper = require('./helpers/mongo-helper');

var MOBILE_NUMBER_EXISTS = 'Mobile number already exists';
var INVALID_MOBILE_NUMBER = 'Invalid mobile number';
var ERROR_UNKNOWN = 'Something went wrong';

var USER_COLLECTION = "user";
var USER_CONTACT_COLLECTION = "user_contacts";

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

function getPhoneNumbersAsArray(contacts) {
    var phoneNumbersForQuery = [];
    for (var index in contacts) {
        var contact = contacts[index];
        var number = contact.number;
        phoneNumbersForQuery.push(number);
    }
    return phoneNumbersForQuery;
}

function attachDisplayName(docs, contacts) {
    for (var index in docs) {
        var contactFromDoc = docs[index];
        for (var cin in contacts) {
            var originalContact = contacts[cin];
            if (originalContact.number === contactFromDoc.mobile_number) {
                contactFromDoc.displayName = originalContact.displayName;
            }
        }
    }
}

var getUserContacts = function (req, res) {
    var contacts = req.body.contacts;
    var user_id = req.body.user_id;
    var responseContact = {"contacts": []};
    if (contacts.length > 0) {
        var phoneNumbersForQuery = getPhoneNumbersAsArray(contacts);
        var fields = ["mobile_number", "user_id"];
        mongoDbHelper.findWithProjection(USER_COLLECTION, {"mobile_number": {$in: phoneNumbersForQuery}, "user_id": {$ne: user_id}, "is_active": true, "is_verified": true}, fields).then(function (docs) {
            var contact_doc = {"user_id": user_id, "contacts": contacts};
            mongoDbHelper.upsertDocument(USER_CONTACT_COLLECTION, {"user_id": user_id}, contact_doc).then(function (isInserted) {
                attachDisplayName(docs, contacts);
                responseContact.contacts = docs;
                res.send(responseContact);
            });
        });
    } else {
        res.send(responseContact);
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
exports.getUserContacts = getUserContacts;