var Promise = require('bluebird');
var Mongo = Promise.promisify(require('mongodb'));
var MongoClient = Promise.promisify(Mongo.MongoClient);

var url = 'mongodb://127.0.0.1:27017/followmate';

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

var upsertDocument = function (collection, conditionAsJson, values) {
    return connectToMongoDb().then(function (db) {
        return db.collection(collection).updateOne(conditionAsJson, values,{upsert:true}).then(function (result) {
            db.close();
            return result.result.ok == 1;
        });
    });
};

var findOneDocument = function (collection, query, options) {
    if(options == null){
        options = {};
    }
    return connectToMongoDb().then(function (db) {
        return db.collection(collection).find(query, options).toArray().then(function (docs) {
            db.close();
            if (docs != null && docs.length > 0){
                return docs[0];
            }else{
                return null;
            }
        });
    });
};

var findWithProjection = function (collection, query, fields) {
    return connectToMongoDb().then(function (db) {
        return db.collection(collection).find(query, fields).toArray().then(function (docs) {
            db.close();
                return docs;
        });
    });
};

var find = function (collection, query) {
    return connectToMongoDb().then(function (db) {
        return db.collection(collection).find(query).toArray().then(function (docs) {
            db.close();
            return docs;
        });
    });
};


exports.isDocumentExists = isDocumentExists;
exports.insertDocument = insertDocument;
exports.updateDocument = updateDocument;
exports.findOneDocument = findOneDocument;
exports.find = find;
exports.findWithProjection = findWithProjection;
exports.upsertDocument = upsertDocument;
