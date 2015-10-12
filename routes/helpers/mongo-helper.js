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

exports.isDocumentExists = isDocumentExists;
exports.insertDocument = insertDocument;