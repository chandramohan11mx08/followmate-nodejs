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
    var userLocation = data.user_location;
    return getNewSessionId().then(function (response) {
        if (response.status) {
            var currentTimestamp = Date.now();
            var data = {
                "session_id": response.session_id,
                "user_id": userId,
                "active": true,
                "start_time": currentTimestamp,
                "participants": [
                    getParticipantObject(userId, userLocation)
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

function getParticipantObject(userId, userLocation) {
    return {"user_id": userId, "joined_at": Date.now(), "start_location": userLocation, "lastest_location": userLocation};
}

var addNewParticipant = function (data) {
    var session_id = data.session_id;
    var userId = data.user_id;
    var userLocation = data.user_location;
    return getSession(session_id).then(function (sessionData) {
        if (sessionData != null) {
            var participants = sessionData.participants;
            sessionData.participants.push(getParticipantObject(userId, userLocation));
            return mongoDbHelper.updateDocument(SESSION_COLLECTION, {"session_id": session_id}, {$set: {"participants": sessionData.participants}}).then(function (isUpdated) {
                return {isAdded:isUpdated, participants: participants} ;
            });
        }else{
            return {isAdded:false, participants: []};
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

var setParticipantOnlineStatus = function (session_id, userId, onlineStatus) {
    return isParticipantOfSession(session_id, userId).then(function (isParticipant) {
        if (isParticipant) {
            return mongoDbHelper.updateDocument(SESSION_COLLECTION, {"session_id": session_id, "participants.user_id": userId}, {$set: {"participants.$.active": onlineStatus}}).then(function (isUpdated) {
                return isUpdated;
            });
        } else {
            return false;
        }
    });
};

var dropUserFromSession = function (req, res) {
    var sessionId = req.body.session_id;
    var userId = req.body.user_id;
    setParticipantOnlineStatus(sessionId, userId, false).then(function (updated) {
        res.send({updated: updated});
    });
}

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
exports.setParticipantOnlineStatus = setParticipantOnlineStatus;
exports.dropUserFromSession = dropUserFromSession;