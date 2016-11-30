/**
 * Created by BharathKumar on 11/25/2016.
 */

var express = require('express');
var getMongoClient = require('../routes/connectMongo');
var router = express.Router();

//API For adding Course
router.post('/addCourse', function (req, res, next) {
    var course = req.body.Course;
    var semester = req.body.Semester;
    var year = req.body.Year;
    var day = req.body.Day;
    var timing = req.body.Timing;
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null){
            console.log("Please Try later");
            res.write("Please Try later");
            res.end();
        }
        else{
            try{
                mongoDbObj.courses.find({$and: [{Semester : semester.toString(), Year : year.toString(), Course: course.toString()}]}, {_id:0,Course:1,Students:1,Timing:1}).toArray(function(err, result){
                    if(err){
                        throw err;
                    }
                    else{
                        if(result.length > 0){
                            res.write("Please enter valid Course Section and Semester and Year");
                            res.end();
                        }
                        else{
                            var tempJSON = { "Course" : course.toString(), "Semester" : semester.toString(),
                                            "Year" : year.toString(), "Day" : day,
                                            "Timing" : timing.toString(), "Students" : []};
                            mongoDbObj.courses.insert( tempJSON,{w:1},function (err) {
                                if(err){
                                    throw err;
                                }
                                else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send({"status" : "204", "message" : "Success"});
                                    res.end();
                                }
                            });
                        }
                    }
                });
            }
            catch(ex){
                res.write(ex.toString());
                res.end();
            }
        }
    });
});

// API For adding Student to a Course
router.post('/addStudent',function (req, res, next) {
    var semester = req.body.Semester;
    var year = req.body.Year;
    var course = req.body.Course;
    var studentList = req.body.Students;
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null){
            console.log("Please Try later");
            res.write("Please Try later");
            res.end();
        }
        else{
            try{
                mongoDbObj.courses.find({$and: [{Semester : semester.toString(), Year : year.toString(), Course: course.toString()}]}, {_id:0,Course:1,Students:1,Timing:1}).toArray(function(err, result){
                    if(err){
                        throw err;
                    }
                    else{
                        if(result.length > 0){
                            console.log(result);
                            var courseDetail = result[0];
                            var tempList = courseDetail.Students;
                            studentList.forEach(function (student) {
                               if(tempList.indexOf(student) > -1){

                               }
                               else{
                                   tempList.push(student);
                               }
                            });
                            mongoDbObj.courses.findAndModify({$and: [{Semester : semester.toString(), Year : year.toString(), Course: course.toString()}]},[],{$set: {Students: tempList}},{}, function (err, result) {
                                if(err){
                                    throw err;
                                }
                                else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send({"status" : "204", "message" : "Success"});
                                    res.end();
                                }
                            });
                        }
                        else{
                            res.write("No Course Found");
                            res.end();
                        }
                    }
                });
            }
            catch(ex){
                res.write(ex.toString());
                res.end();
            }
        }
    });
});

module.exports = router;