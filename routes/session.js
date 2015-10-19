var shortIdHelper = require('./helpers/shortid-helper');
var mongoDbHelper = require('./helpers/mongo-helper');
var Promise = require('bluebird');

var UNKNOWN_USER = "Unknown user";
var ERROR_UNKNOWN = 'Something went wrong';

var SESSION_COLLECTION="session";

var sendResponse = function (isSessionCreated, sessionId, message) {
    console.log("response "+isSessionCreated);
    return ({'is_session_created': isSessionCreated, 'session_id': sessionId, 'msg': message});
};

var createNewSession = function (data) {
    var userId = data.user_id;
    return getNewSessionId().then(function (response) {
        if (response.status) {
            var data = {
                "session_id": response.session_id,
                "user_id": userId,
                "start_time": Date.now()
            };
            return mongoDbHelper.insertDocument(SESSION_COLLECTION, data).then(function (result) {
                return sendResponse(true, response.session_id);
            });
        }
    });
};

var getNewSessionId = function () {
    var shortId = shortIdHelper.getShortId();
    return mongoDbHelper.isDocumentExists(SESSION_COLLECTION, {'session_id': shortId}).then(function (isExists) {
        if (isExists) {
            getNewSessionId();
        } else {
            return {"status": true, "session_id": shortId};
        }
    });
};

//var data2 = {"user_id": 1234};
//var response = createNewSession(data2).then(function(response){
//    console.log("response");
//    console.dir(response);
//});

exports.createNewSession = createNewSession;
//exports.getNewSessionId = getNewSessionId;