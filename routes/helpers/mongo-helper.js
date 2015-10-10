var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/followmate';

var connectToMongoDb = function(callBack){
    MongoClient.connect(url, function (err, db) {
        if(err){
            console.log("Failed to connect to db");
            console.dir(err)
            return;
        }
        else{
            callBack(null, db);
            console.log("Connected correctly to server.");
        }
    });
}

var insertDocument = function(jsonString, callBack){
    connectToMongoDb(function(err,db){
        if(err){
            return;
        }
        else{
            db.collection('session').insertOne(jsonString,function(err, result){
                if(err){
                    console.log("Failed to insert document");
                    console.dir(err);
                }else{
                    console.log("Inserted successfully");
                }
                db.close();
                callBack(err,result);
            });
        }
    });
};
