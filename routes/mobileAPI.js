/**
 * Created by BharathKumar on 11/24/2016.
 */
var express = require('express');
var getMongoClient = require('../routes/connectMongo');
var router = express.Router();

// API For Registering Student
router.post('/register', function(req, res, next) {
    var userId = req.body.UserId;
    var password = req.body.Password;
    var imeiNumber = req.body.IMEI;
    var fName = req.body.FirstName;
    var lName = req.body.LastName;
    var emailId = req.body.EmailId;
    getMongoClient.mongoDbObj(function(mongoDbObj){
        if(mongoDbObj==null){
            res.setHeader('Content-Type', 'application/json');
            res.status(450);
            res.send({"Message" : "DataBase Connection Failed"});
        }
        else {
            try{
                mongoDbObj.imei.find({"IMEI" : imeiNumber}).toArray(function (err1, result1) {
                    if(err1){
                        throw err1;
                    }
                    else{
                        if(result1.length > 0){
                            console.log(result1);
                            res.end();
                        }
                        else{
                            mongoDbObj.user.find({$or: [{UserId : userId.toString()}, {EmailId : emailId.toString()}]}, {_id:0,UserId:1, EmailId:1}).toArray(function(err2, result2){
                                if(err2){
                                    throw err2;
                                }
                                else{
                                    if(result2.length > 0){
                                        res.end();
                                    }
                                    else{
                                        mongoDbObj.imei.insert({"IMEI" : imeiNumber},{w:1},function (err3) {
                                            if(err3){
                                                throw err3;
                                            }
                                            else{
                                                var tempJSON = { "UserId" : userId.toString(),
                                                    "Password" : password.toString(),
                                                    "Type" : "Student",
                                                    "FirstName" : fName.toString(),
                                                    "LastName" : lName.toString(),
                                                    "EmailId" : emailId.toString(),
                                                    "IMEI" : [imeiNumber.toString()]
                                                    };
                                                mongoDbObj.user.insert(tempJSON,{w:1},function (err) {
                                                    if(err){
                                                        mongoDbObj.imei.remove({"IMEI" : imeiNumber});
                                                        throw err;
                                                    }
                                                    else{
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.status(200);
                                                        res.send({"Message" : "Success"});
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            } catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.status(450);
                res.send({"Message" : ex.toString()});
            }
        }
    });
});

//API For Logging in
router.post('/login', function(req, res, next){
    var userId = req.body.UserId;
    var password = req.body.Password;
    var imei = req.body.IMEI;
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null) {
            res.setHeader('Content-Type', 'application/json');
            res.status(450);
            res.send({"Message" : "DataBase Connection Failed"});
        }
        else{
            try{
                mongoDbObj.user.find({$and: [{UserId : userId.toString(), Password : password.toString(), Type : "Student"}]}, {_id:0, UserId:1, Password:1, FirstName:1, LastName:1, EmailId:1, IMEI:1}).toArray(function(err, result){
                    if(err){
                        throw err;
                    }
                    else{
                        if(result.length > 0){
                            var flag = false;
                            result.forEach(function(tempResult){
                                var imeiList = tempResult.IMEI;
                                if(imeiList.indexOf(imei) > -1){
                                    flag = true;
                                }
                            });
                            if(flag){
                                console.log(result);
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200);
                                res.send({"Message" : "Success", "UserId" : userId, "Password" : password, "FirstName" : result[0].FirstName, "LastName" : result[0].LastName, "EmailId" : result[0].EmailId, "IMEI" : imei });
                            }
                            else{
                                res.setHeader('Content-Type', 'application/json');
                                res.status(204);
                                res.send({"Message" : "No Students Found"});
                            }
                        }
                        else{
                            res.setHeader('Content-Type', 'application/json');
                            res.status(204);
                            res.send({"Message" : "No Students Found"});
                        }
                    }
                });
            }
            catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.status(450);
                res.send({"Message" : ex.toString()});
            }
        }
    });
});

// API For Returning Course List based on Student ID
router.post('/getCourses', function (req, res, next) {
   var userId = req.body.UserId;
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
   if((1<=month)&&(month<=5)){
        semester = "Spring";
   }
   else if((6<=month)&&(month<=8)){
       semester = "Summer";
   }
   else if((9<=month)&&(month<=12)){
       semester = "Fall";
   }
   getMongoClient.mongoDbObj(function(mongoDbObj){
        if(mongoDbObj==null) {
            res.setHeader('Content-Type', 'application/json');
            res.status(450);
            res.send({"Message" : "DataBase Connection Failed"});
        }
        else{
            try{
                mongoDbObj.courses.find({$and: [{Semester : semester.toString(), Year : year.toString()}]}, {_id:0,Semester:1, Year:1, Day:1, CourseId:1, StudentList:1, ClassTime:1}).toArray(function(err, result){
                   if(err){
                       throw err;
                   }
                   else{
                       if(result.length > 0){
                           // Write the logic for returning Course list
                           var courseList = [];
                           result.forEach(function(tempResult){
                              var studentList = tempResult.StudentList;
                              var dayList = tempResult.Day;
                              var tempJSON = {};
                              if(studentList.indexOf(studentId) > -1){
                                  if(dayList.indexOf(day) > -1) {
                                      tempJSON = {"Course" : tempResult.CourseId, "Semester" : tempResult.Semester,
                                          "Year" : tempResult.Year, "Day" : tempResult.Day, "ClassTime" : tempResult.ClassTime};
                                      courseList.push(tempJSON);
                                  }
                              }
                           });
                           if(courseList.length > 0){
                               res.setHeader('Content-Type', 'application/json');
                               res.status(200);
                               res.send({"Message" : "Success", "CourseList" : courseList});
                           }
                           else{
                               res.setHeader('Content-Type', 'application/json');
                               res.status(204);
                               res.send({"Message" : "No Classes Today"});
                           }
                       }
                       else{
                           res.setHeader('Content-Type', 'application/json');
                           res.status(204);
                           res.send({"Message" : "No Courses Found for the student"});
                       }
                   }
                });
            }
            catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.status(450);
                res.send({"Message" : ex.toString()});
            }
        }
   });
});

module.exports = router;
