/**
 * Created by Bharath Kumar on 11/24/2016.
 */


var mongoClient=require('mongodb').MongoClient;
var mongoDbObj = null;
var connected = false;
//maverick1234:1234@ds161225.mlab.com:61225

exports.mongoDbObj = function(callback){
    mongoClient.connect('mongodb://maverick1234:1234@ds161225.mlab.com:61225/cmpe273-db', function(err, db) {
        if (err) {
            mongoDbObj = null;
            connected = false;
            callback(mongoDbObj);
        }
        else {
            console.log("Connected to MongoDB");
            mongoDbObj = {
                db: db,
                user: db.collection('User'),
                imei: db.collection('IMEI'),
                courses: db.collection('Courses'),
                attendances: db.collection('Attendances')
            };
            connected = true;
            callback(mongoDbObj);
        }
    });
};