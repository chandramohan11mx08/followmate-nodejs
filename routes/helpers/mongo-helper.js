var Promise = require('bluebird');
var Mongo = Promise.promisify(require('mongodb'));
var MongoClient = Promise.promisify(Mongo.MongoClient);

var url = 'mongodb://localhost:27017/followmate';

var connectToMongoDb = function () {
    return MongoClient.connect(url).then(function (db) {
        return (db);
    });
};

var insertDocument = function (collection, document) {
    return connectToMongoDb().then(function (db) {
        return db.collection(collection).insertOne(document).then(function (result) {
            db.close();
            return result;
        });
    });
};

var isDocumentExists = function (collection, conditionAsJson) {
    return connectToMongoDb().then(function (db) {
        return db.collection(collection).find(conditionAsJson).toArray().then(function (docs) {
            db.close();
            return docs.length > 0;
        });
    });
};

var updateDocument = function (collection, conditionAsJson, values) {
    return connectToMongoDb().then(function (db) {
        return db.collection(collection).updateOne(conditionAsJson, values).then(function (result) {
            db.close();
            return result.result.ok == 1;
        });
    });
};

var findOneDocument = function (collection, query) {
    return connectToMongoDb().then(function (db) {
        return db.collection(collection).find(query).toArray().then(function (docs) {
            db.close();
            if (docs != null && docs.length > 0){
                return docs[0];
            }else{
                return null;
            }
        });
    });
};

//var data2 = {"session_id": "Nkow2pCgg"};
//var participants = ["123", "124", "125"];
//participants.push("126");
//var response = updateDocument("session", data2, {$set: { "participants": participants }}).then(function (response) {
//    console.log("response");
//    console.dir(response);
//});

//var response = findOneDocument("session", data2).then(function (response) {
//    console.log("response");
//    console.dir(response);
//});
exports.isDocumentExists = isDocumentExists;
exports.insertDocument = insertDocument;
exports.updateDocument = updateDocument;
exports.findOneDocument = findOneDocument;
