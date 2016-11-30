/**
 * Created by BharathKumar on 11/24/2016.
 */
var express = require('express');
var getMongoClient = require('../routes/connectMongo');
var router = express.Router();

// API For Registering Student
router.post('/register', function(req, res, next) {
    var studentId = req.body.StudentId;
    var password = req.body.Password;
    var imeiNumber = req.body.IMEI;
    getMongoClient.mongoDbObj(function(mongoDbObj){
        if(mongoDbObj==null){
            console.log("Please Try later");
            res.write("Please Try later");
            res.end();
        }
        else {
            try{
                mongoDbObj.imei.find({"IMEI" : imeiNumber}).toArray(function (err, result) {
                    if(err){
                        throw err;
                    }
                    else{
                        if(result.length > 0){
                            console.log("hey");
                            res.end();
                        }
                        else{
                            mongoDbObj.imei.insert({"IMEI" : imeiNumber},{w:1},function (err) {
                                if(err){
                                    throw err;
                                }
                                else{
                                    var tempJSON = { "StudentId" : studentId.toString(),
                                        "Password" : password.toString(),
                                        "IMEI" : [imeiNumber.toString()],
                                        "Type" : "Student"};
                                    mongoDbObj.user.insert(tempJSON,{w:1},function (err) {
                                        if(err){
                                            mongoDbObj.imei.remove({"IMEI" : imeiNumber});
                                            throw err;
                                        }
                                        else{
                                            res.setHeader('Content-Type', 'application/json');
                                            res.send({"status" : "204", "message" : "Success"});
                                            res.end();
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            } catch(ex){
                res.send(ex.toString());
                res.end();
            }
        }
    });
});

//API For Logging in
router.post('/login', function(req, res, next){
    var studentId = req.body.StudentId;
    var password = req.body.Password;
    var imei = req.body.IMEI;
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null) {
            res.write("Please try again");
            res.end();
        }
        else{
            try{
                mongoDbObj.user.find({$and: [{StudentId : studentId.toString(), Password : password.toString()}]}, {_id:0,StudentId:1, Password:1, IMEI:1}).toArray(function(err, result){
                    if(err){
                        throw err;
                    }
                    else{
                        if(result.length > 0){
                            // Write the logic for returning Course list
                            var flag = false;
                            result.forEach(function(tempResult){
                                var imeiList = tempResult.IMEI;
                                if(imeiList.indexOf(imei) > -1){
                                    flag = true;
                                }
                            });
                            if(flag){
                                res.setHeader('Content-Type', 'application/json');
                                res.send({"message" : "Success", "StudentId" : studentId });
                            }
                            else{
                                res.write("No Students Found");
                                res.end();
                            }
                        }
                        else{
                            res.write("No Students Found");
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

// API For Returning Course List based on Student ID
router.post('/getCourses', function (req, res, next) {
   var studentId = req.body.StudentId;
   var date = new Date();
   var year = date.getFullYear();
   var month = date.getMonth() + 1;
    var weekday = new Array(7);
    weekday[0]=  "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";
   var day = weekday[date.getDay()];
   var semester = null;
   console.log(month);
   console.log(day);
   if((1<=month)&&(month<=5)){
        semester = "Spring";
   }
   else if((6<=month)&&(month<=8)){
       semester = "Summer";
   }
   else if((9<=month)&&(month<=12)){
       semester = "Winter";
   }
   console.log(semester);
   getMongoClient.mongoDbObj(function(mongoDbObj){
        if(mongoDbObj==null) {
            res.write("Please try again");
            res.end();
        }
        else{
            try{
                mongoDbObj.courses.find({$and: [{Semester : semester.toString(), Year : year.toString()}]}, {_id:0,Semester:1, Year:1, Day:1, Course:1, Students:1, Timing:1}).toArray(function(err, result){
                   if(err){
                       throw err;
                   }
                   else{
                       if(result.length > 0){
                           // Write the logic for returning Course list
                           var courseList = [];
                           result.forEach(function(tempResult){
                              var studentList = tempResult.Students;
                              var dayList = tempResult.Day;
                              var tempJSON = {};
                              if(studentList.indexOf(studentId) > -1){
                                  if(dayList.indexOf(day) > -1) {
                                      tempJSON = {"Course" : tempResult.Course, "Semester" : tempResult.Semester,
                                          "Year" : tempResult.Year, "Day" : tempResult.Day, "Timing" : tempResult.Timing};
                                      courseList.push(tempJSON);
                                  }
                              }
                           });
                           if(courseList.length > 0){
                               res.setHeader('Content-Type', 'application/json');
                               res.send({"message" : "Success", "courseList" : courseList});
                           }
                           else{
                               res.write("No Classes Today");
                           }
                           res.end();
                       }
                       else{
                           res.write("No Courses Found for the student");
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
