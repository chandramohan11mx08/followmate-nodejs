var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/followmate';

var connectToMongoDb = function (callBack) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log("Failed to connect to db");
            return;
        }
        else {
            callBack(null, db);
        }
    });
}

var insertDocument = function (collection, document, callBack) {
    connectToMongoDb(function (err, db) {
        if (err) {
            return;
        }
        else {
            db.collection(collection).insertOne(document, function (err, result) {
                if (err) {
                    console.log("Failed to insert document");
                }
                db.close();
                callBack(err, result);
            });
        }
    });
};

var isDocumentExists = function (collection, conditionAsJson, callBack) {
    connectToMongoDb(function (err, db) {
        if (err) {
            return;
        } else {
            db.collection(collection).find(conditionAsJson).toArray(function (err, docs) {
                if (err) {
                    callBack(err, true);
                    return;
                } else {
                    callBack(null, docs.length > 0);
                }
                db.close();
            });
        }
    });
};

exports.isDocumentExists = isDocumentExists;
exports.insertDocument = insertDocument;