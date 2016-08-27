var shortIdHelper = require('./helpers/shortid-helper');
var mongoDbHelper = require('./helpers/mongo-helper');
var Participant = require('../models/Participant');
var Session = require('../models/Session');
var _ = require('lodash');

var SESSION_COLLECTION="session";

var sendResponse = function (isSessionCreated, sessionId, message) {
    console.log("response "+isSessionCreated);
    return ({'is_session_created': isSessionCreated, 'session_id': sessionId, 'msg': message});
};

var sendResponseForCreateSession = function (res, isSessionCreated, sessionId, message) {
    console.log("response for create "+isSessionCreated);
    res.send({'is_session_created': isSessionCreated, 'session_id': sessionId, 'msg': message});
};

var sendResponseForJoinSession = function (res, joined,session_id, participants, message) {
    console.log("response for join "+joined);
    res.send({ joined: true, session_id: session_id, participants: participants,msg:message});
};

var createNewSession = function (data) {
    var userId = data.user_id;
    var userLocation = data.user_location;
    return getNewSessionId().then(function (response) {
        if (response.status) {
            var currentTimestamp = Date.now();
            var sessionId = response.session_id;
            var session = Session.getSessionObject();
            session.session_id = sessionId;
            session.user_id = userId;
            session.active = true;
            session.start_time = currentTimestamp;
            session.participants.push(Participant.getParticipantObject(userId, userLocation));
            return mongoDbHelper.insertDocument(SESSION_COLLECTION, session).then(function (result) {
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

var addNewParticipant = function (data) {
    var session_id = data.session_id;
    var userId = data.user_id;
    var userLocation = data.user_location;
    var visibility = data.visibility;
    return getSession(session_id).then(function (sessionData) {
        if (sessionData != null) {
            var participants = sessionData.participants;
            var participantObject = Participant.getParticipantObject(userId, userLocation);
            participantObject.visibility = visibility;
            sessionData.participants.push(participantObject);
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

var setParticipantVisibility= function (session_id, userId, visibility) {
    return isParticipantOfSession(session_id, userId).then(function (isParticipant) {
        if (isParticipant) {
            return mongoDbHelper.updateDocument(SESSION_COLLECTION, {"session_id": session_id, "participants.user_id": userId}, {$set: {"participants.$.visibility": visibility}}).then(function (isUpdated) {
                return isUpdated;
            });
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

var setParticipantTerminatedStatus = function (session_id, userId, terminated) {
    return isParticipantOfSession(session_id, userId).then(function (isParticipant) {
        if (isParticipant) {
            return mongoDbHelper.updateDocument(SESSION_COLLECTION,
                {"session_id": session_id, "participants.user_id": userId},
                {$set:
                    {"participants.$.terminated": terminated,
                    "participants.$.active": false}
                }).then(function (isUpdated) {
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

var setSessionAsFinished = function (session_id) {
    return mongoDbHelper.updateDocument(SESSION_COLLECTION, {"session_id": session_id}, {$set :{active: false}}).then(function (isUpdated) {
        return isUpdated;
    });
};

var startSession = function (req, res) {
    var data = req.body;
    if (data.user_id == null || data.user_id =="") {
        sendResponseForCreateSession(res, false, null, "Unknown user");
    } else {
        createNewSession(data).then(function (sessionData) {
            if (sessionData.is_session_created) {
                sendResponseForCreateSession(res, true, sessionData.session_id, "success");
            }
            sendResponseForCreateSession(res, false, null, "Something went wrong");
        });
    }
}

var joinSession = function (req, res) {
    var data = req.body;
    if (data.user_id == null || data.session_id == null) {
        sendResponseForJoinSession(res, false, data.session_id, null, "Invalid request");
    } else {
        addNewParticipant(data).then(function (response) {
            if (response.isAdded) {
                sendResponseForJoinSession(res, true, data.session_id, response.participants, "success");
            } else {
                sendResponseForJoinSession(res, false, data.session_id, null, "Something went wrong");
            }
        });
    }
}

var endUserSession = function (sessionId, userId) {
    var returnObject = {err: null, active_participants: null, terminated:false};
    return setParticipantTerminatedStatus(sessionId, userId, true).then(function (updated) {
        if(updated){
            return getSession(sessionId).then(function (sessionData) {
                var participants = sessionData.participants;
                var activeParticipants = _.filter(participants, function (participant) {
                    return ((!participant.terminated) && participant.active);
                });
                if (activeParticipants.length == 0) {
                    setSessionAsFinished(sessionId);
                }
                returnObject.active_participants = activeParticipants;
                returnObject.terminated = true;
                return returnObject;
            });
        }else{
            returnObject.err = "Something went wrong";
            return returnObject;
        }
    });
}

exports.startSession = startSession;
exports.joinSession = joinSession;
exports.sendResponse = sendResponse;
exports.createNewSession = createNewSession;
exports.getSession = getSession;
exports.addNewParticipant = addNewParticipant;
exports.isParticipantOfSession = isParticipantOfSession;
exports.setParticipantOnlineStatus = setParticipantOnlineStatus;
exports.setParticipantVisibility = setParticipantVisibility;
exports.dropUserFromSession = dropUserFromSession;
exports.endUserSession = endUserSession;
