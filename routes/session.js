var shortIdHelper = require('./helpers/shortid-helper');
var mongoDbHelper = require('./helpers/mongo-helper');

var UNKNOWN_USER = "Unknown user";
var ERROR_UNKNOWN = 'Something went wrong';

var SESSION_COLLECTION="session";

var sendResponse = function (res, isSessionCreated,sessionId, message) {
    res.send({'is_session_created': isSessionCreated,'session_id':sessionId ,'msg': message});
};

function getNewSessionObject(userId, mobileNumber) {
    var document = {'user_id': userId,
        'mobile_number': mobileNumber,
        'is_verified': false,
        'timestamp': Date.now()};
    return document;
}

var createNewSession = function (req, res) {
    var data = req.body;
    console.dir(data);
    var userId = data.user_id;
    if (userId == null) {
        sendResponse(res, false, null, UNKNOWN_USER);
    } else {
        getNewSessionId().then(function (response) {
            if (response.status) {
                var document = getNewSessionObject(response.session_id, userId);
                mongoDbHelper.insertDocument(SESSION_COLLECTION, document).then(function (result) {
//                            sendResponse(res, true, response.user_id);
                });
            }
        });
    }
};

var getNewSessionId = function () {
    var shortId = shortIdHelper.getShortId();
    return mongoDbHelper.isDocumentExists(SESSION_COLLECTION, {'session_id': shortId}).then(function (isExists) {
        if (isExists) {
            getNewSessionId();
        } else {
            console.log("session id created " + shortId);
            return {"status": true, "session_id": shortId};
        }
    });
};

exports.createNewSession = createNewSession;