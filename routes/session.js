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
            var currentTimestamp = Date.now();
            var data = {
                "session_id": response.session_id,
                "user_id": userId,
                "start_time": currentTimestamp,
                "participants": [
                    {"user_id": userId, "joined_at": currentTimestamp}
                ]
            };
            return mongoDbHelper.insertDocument(SESSION_COLLECTION, data).then(function (result) {
                var sessionCreated = result.result.n > 0;
                return sendResponse(sessionCreated , response.session_id);
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

var addNewParticipant = function (session_id, userId) {
    return getSession(session_id).then(function (sessionData) {
        if (sessionData != null) {
            sessionData.participants.push({"user_id": userId, "joined_at": Date.now()});
            return mongoDbHelper.updateDocument(SESSION_COLLECTION, {"session_id": session_id}, {$set: {"participants": sessionData.participants}}).then(function (isUpdated) {
                return isUpdated;
            });
        }else{
            return false;
        }
    });
};

var isParticipantOfSession = function (session_id, userId) {
    return getSession(session_id).then(function (sessionData) {
        if (sessionData != null) {
            var participants = sessionData.participants;
            for(var participant in participants) {
                var p = participants[participant];
                if (p.user_id == userId) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
    });
};

var getSession = function (session_id) {
    return mongoDbHelper.findOneDocument(SESSION_COLLECTION, {"session_id": session_id}).then(function (sessionData) {
        return sessionData;
    });
};
//var data2 = {"user_id": 1234};
//var response = createNewSession(data2).then(function(response){
//    console.log("response");
//    console.dir(response);
//});

exports.sendResponse = sendResponse;
exports.createNewSession = createNewSession;
exports.getSession = getSession;
exports.addNewParticipant = addNewParticipant;
exports.isParticipantOfSession = isParticipantOfSession;
