/**
 * Created by BharathKumar on 11/25/2016.
 */

var express = require('express');
var getMongoClient = require('../routes/connectMongo');
var router = express.Router();

//API For adding Course
router.post('/addCourse', function (req, res, next) {
    var semester = req.body.Semester;
    var year = req.body.Year;
    var courseId = req.body.CourseId;
    var classTime = req.body.ClassTime;
    var day = req.body.Day;
    var professorId = req.body.UserId;
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null){
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else{
            try{
                mongoDbObj.courses.find({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]}, {_id:0,Course:1,Students:1,Timing:1}).toArray(function(err1, result1){
                    if(err1){
                        throw err1;
                    }
                    else{
                        if(result1.length > 0){
                            res.write("Please enter valid Course Section and Semester and Year");
                            res.end();
                        }
                        else{
                            var tempJSON = { "Semester" : semester.toString(), "Year" : year.toString(),
                                "CourseId" : courseId.toString(), "Day" : day, "ClassTime" : classTime.toString(),
                                "StudentList" : [], "ProfessorId" : professorId.toString()};
                            mongoDbObj.courses.insert( tempJSON,{w:1},function (err2) {
                                if(err2){
                                    throw err2;
                                }
                                else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send({"Status" : "204", "Message" : "Success"});
                                }
                            });
                        }
                    }
                });
            }
            catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.send({"Code" : "450", "Message" : ex.toString()});
            }
        }
    });
});

// API For adding Student to a Course
router.post('/addStudent',function (req, res, next) {
    var semester = null;
    var date = new Date();
    var month = date.getMonth() + 1;
    if((1<=month)&&(month<=5)){
        semester = "Spring";
    }
    else if((6<=month)&&(month<=8)){
        semester = "Summer";
    }
    else if((9<=month)&&(month<=12)){
        semester = "Winter";
    }
    var year = date.getFullYear();
    var courseId = req.body.CourseId;
    var studentList = req.body.StudentList;
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null){
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else{
            try{
                mongoDbObj.courses.find({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]}, {_id:0,CourseId:1,StudentList:1,ClassTime:1}).toArray(function(err1, result1){
                    if(err1){
                        throw err1;
                    }
                    else{
                        if(result1.length > 0){
                            var courseDetail = result1[0];
                            var tempList = courseDetail.StudentList;
                            studentList.forEach(function (student) {
                                if(tempList.indexOf(student) > -1){

                                }
                                else{
                                    tempList.push(student);
                                }
                            });
                            mongoDbObj.courses.findAndModify({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]},[],{$set: {StudentList: tempList}},{}, function (err, result) {
                                if(err){
                                    throw err;
                                }
                                else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send({"status" : "204", "message" : "Success"});
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
                res.setHeader('Content-Type', 'application/json');
                res.send({"Code" : "450", "Message" : ex.toString()});
            }
        }
    });
});

//API For Dashboard
router.post('/getSummary',function (req, res, next) {
    var courseId = req.body.CourseId;
    var date = new Date();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var semester = null;
    if((1<=month)&&(month<=5)){
        semester = "Spring";
    }
    else if((6<=month)&&(month<=8)){
        semester = "Summer";
    }
    else if((9<=month)&&(month<=12)){
        semester = "Winter";
    }
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null){
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else{
            try{
                mongoDbObj.attendances.find({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]}, {_id:0,Attendances:1}).toArray(function (err, result) {
                    if(err){
                        throw err;
                    }
                    else{
                        if(result.length > 0){
                            var studentCount = [0,0,0,0,0,0,0,0,0,0,0,0];
                            result[0].Attendances.forEach(function (dataEntry) {
                                var entryDate = new Date(dataEntry.Date);
                                var index = date.getMonth();
                                studentCount[index] = studentCount[index] + dataEntry.StudentData.length;
                            });
                            var monthList = ["January", "February", "March", "April", "May","June","July","August","September","October","November","December"];
                            res.setHeader('Content-Type', 'application/json');
                            res.send({"Months" : monthList , "AttendanceCount" : studentCount});
                        }
                        else{
                            res.write("No Attendance Found");
                            res.end();
                        }
                    }
                });
            }
            catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.send({"Code" : "450", "Message" : ex.toString()});
            }
        }
    });
});

//API for Adding Attendance
router.post('/addAttendance', function (req, res, next) {
    var userId = req.body.UserId;
    var courseId = req.body.CourseId;
    var punchTime = req.body.EntryTime;
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var semester = null;
    punchTime = date.getTime();
    var day1 = date.getDate();
    var day = month+"/"+day1+"/"+year;
    if((1<=month)&&(month<=5)){
        semester = "Spring";
    }
    else if((6<=month)&&(month<=8)){
        semester = "Summer";
    }
    else if((9<=month)&&(month<=12)){
        semester = "Winter";
    }
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null){
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else{
            try{
                mongoDbObj.attendances.find({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]}, {_id:0,Attendances:1}).toArray(function (err, result) {
                    if(err){
                        throw err;
                    }
                    else{
                        if(result.length > 0){
                            var BreakException = {};
                            var EntryException = [];
                            try{
                                var tempResult = result[0];
                                tempResult.Attendances.forEach(function (dataEntry){
                                    var flag = false;
                                    var d1 = new Date(dataEntry.Date);
                                    var d2 = new Date();
                                    if(d1.getDate()==d2.getDate() && d1.getFullYear()==d2.getFullYear() && d1.getMonth()==d2.getMonth()){
                                        var StudentList = dataEntry.StudentData;
                                        StudentList.forEach(function (student) {
                                            if(student.UserId == userId){
                                                flag = true;
                                            }
                                        });
                                        if(flag){
                                            throw EntryException;
                                        }
                                        else{
                                            var tempJSON = { "UserId" : userId.toString(), "EntryTime" : punchTime};
                                            StudentList.push(tempJSON);
                                            dataEntry.StudentData = StudentList;
                                            throw BreakException;
                                        }
                                    }
                                });
                            }
                            catch(breakEx){
                                if(breakEx==BreakException){
                                    mongoDbObj.attendances.findAndModify({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]},[],{$set: {Attendances: result[0].Attendances}},{}, function (err1, result1) {
                                        if(err1){
                                            throw err1;
                                        }
                                        else{
                                            res.setHeader('Content-Type', 'application/json');
                                            res.send({"status" : "204", "message" : "Success"});
                                        }
                                    });
                                }
                                else if(breakEx==EntryException){
                                    res.write("Already Entered Data");
                                    res.end();
                                }
                                else{
                                    throw breakEx;
                                }
                            }
                        }
                        else{
                            //Change Code to ADD first Entry
                            console.log(day);
                            day = new Date();
                            var entryJSON = {"CourseId" : courseId.toString(), "Semester" : semester.toString(), "Year" : year.toString(), "Attendances" : [{"Date" : day, "StudentData" : [{"UserId" : userId, "EntryTime" : punchTime}]}]};
                            mongoDbObj.attendances.insert( entryJSON,{w:1},function (err2) {
                                if(err2){
                                    throw err2;
                                }
                                else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send({"Status" : "204", "Message" : "Success"});
                                }
                            });
                        }
                    }
                });
            }
            catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.send({"Code" : "450", "Message" : ex.toString()});
            }
        }
    });
});

//API For getting Student List As Per Date
router.post('/getStudentList', function(req, res, next){
    var courseId = req.body.CourseId;
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var semester = null;
    if((1<=month)&&(month<=5)){
        semester = "Spring";
    }
    else if((6<=month)&&(month<=8)){
        semester = "Summer";
    }
    else if((9<=month)&&(month<=12)){
        semester = "Winter";
    }
    var reqDate = req.body.Date;
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if (mongoDbObj == null) {
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else {
            try{
                mongoDbObj.attendances.find({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]}, {_id:0,Attendances:1}).toArray(function (err, result) {
                    if(err){
                        throw err;
                    }
                    else{
                        if(result.length > 0){
                            try{
                                var tempResult = result[0];
                                console.log(tempResult);
                                var resultList = [];
                                tempResult.Attendances.forEach(function (dataEntry){
                                    var flag = false;
                                    var d1 = new Date(dataEntry.Date);
                                    var d2 = new Date();
                                    if(d1.getDate()==d2.getDate() && d1.getFullYear()==d2.getFullYear() && d1.getMonth()==d2.getMonth()){
                                        var StudentList = dataEntry.StudentData;
                                        StudentList.forEach(function (student) {
                                            resultList.push(student.UserId);
                                        });
                                    }
                                });
                                res.setHeader('Content-Type', 'application/json');
                                res.send({"StudentList" : resultList});
                            }
                            catch(breakEx){
                                if(breakEx==BreakException){
                                    mongoDbObj.attendances.findAndModify({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]},[],{$set: {Attendances: result[0].Attendances}},{}, function (err1, result1) {
                                        if(err1){
                                            throw err1;
                                        }
                                        else{
                                            res.setHeader('Content-Type', 'application/json');
                                            res.send({"status" : "204", "message" : "Success"});
                                        }
                                    });
                                }
                                else if(breakEx==EntryException){
                                    res.write("Already Entered Data");
                                    res.end();
                                }
                                else{
                                    throw breakEx;
                                }
                            }
                        }
                        else{
                            //Change Code to ADD first Entry
                            console.log(day);
                            day = new Date();
                            var entryJSON = {"CourseId" : courseId.toString(), "Semester" : semester.toString(), "Year" : year.toString(), "Attendances" : [{"Date" : day, "StudentData" : [{"UserId" : userId, "EntryTime" : punchTime}]}]};
                            mongoDbObj.attendances.insert( entryJSON,{w:1},function (err2) {
                                if(err2){
                                    throw err2;
                                }
                                else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send({"Status" : "204", "Message" : "Success"});
                                }
                            });
                        }
                    }
                });
            }
            catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.send({"Code" : "450", "Message" : ex.toString()});
            }
        }
    });
});

//API For getting Date list from Attendance
router.post('/getDates', function (req, res, next) {
    var courseId = req.body.CourseId;
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var semester = null;
    if((1<=month)&&(month<=5)){
        semester = "Spring";
    }
    else if((6<=month)&&(month<=8)){
        semester = "Summer";
    }
    else if((9<=month)&&(month<=12)){
        semester = "Winter";
    }
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if (mongoDbObj == null) {
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else {
            try {
                mongoDbObj.attendances.find({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]}, {_id:0,Attendances:1}).toArray(function (err, result) {
                    if (err) {
                        throw err;
                    }
                    else {
                        if (result.length > 0) {
                            var dateList = [];
                            result[0].Attendances.forEach(function (dataEntry){
                                dateList.push(dataEntry.Date);
                            });
                            res.setHeader('Content-Type', 'application/json');
                            res.send({"DateList" : dateList});
                        }
                        else{
                            res.write("No Dates Found");
                            res.end();
                        }
                    }
                });
            }
            catch (ex) {
                res.setHeader('Content-Type', 'application/json');
                res.send({"Code" : "450", "Message" : ex.toString()});
            }
        }
    });
});

//API For Professor Registration
router.post('/register', function(req, res, next) {
    var userId = req.body.UserId;
    var password = req.body.Password;
    var fName = req.body.FirstName;
    var lName = req.body.LastName;
    var emailId = req.body.EmailId;
    getMongoClient.mongoDbObj(function(mongoDbObj){
        if(mongoDbObj==null){
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else {
            try{
                mongoDbObj.user.find({$or: [{UserId : userId.toString()}, {EmailId : emailId.toString()}]}, {_id:0,UserId:1, EmailId:1}).toArray(function(err2, result2){
                    if(err2){
                        throw err2;
                    }
                    else{
                        if(result2.length > 0){
                            console.log(result2);
                            console.log("Hey");
                            res.end();
                        }
                        else{
                            var tempJSON = { "UserId" : userId.toString(),
                                "Password" : password.toString(),
                                "Type" : "Professor",
                                "FirstName" : fName.toString(),
                                "LastName" : lName.toString(),
                                "EmailId" : emailId.toString()
                            };
                            mongoDbObj.user.insert(tempJSON,{w:1},function (err) {
                                if(err){
                                    throw err;
                                }
                                else{
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send({"Status" : "204", "Message" : "Success"});
                                    res.end();
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

//API For Logging in Professor
router.post('/login', function(req, res, next){
    var userId = req.body.UserId;
    var password = req.body.Password;
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null) {
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else{
            try{
                mongoDbObj.user.find({$and: [{UserId : userId.toString(), Password : password.toString(), Type : "Professor"}]}, {_id:0, UserId:1, Password:1, FirstName:1, LastName:1, EmailId:1, IMEI:1}).toArray(function(err, result){
                    if(err){
                        throw err;
                    }
                    else{
                        if(result.length > 0){
                            console.log(result);
                            res.setHeader('Content-Type', 'application/json');
                            res.send({"Message" : "Success", "UserId" : userId, "Password" : password, "FirstName" : result[0].FirstName, "LastName" : result[0].LastName, "EmailId" : result[0].EmailId});
                        }
                        else{
                            res.write("No Professors Found");
                            res.end();
                        }
                    }
                });
            }
            catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.send({"Code" : "450", "Message" : ex.toString()});
            }
        }
    });
});

//API For getting Student List by CourseID
router.post('/getStudentListByCourse', function (req, res, next) {
    var courseId = req.body.CourseId;
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var semester = null;
    if((1<=month)&&(month<=5)){
        semester = "Spring";
    }
    else if((6<=month)&&(month<=8)){
        semester = "Summer";
    }
    else if((9<=month)&&(month<=12)){
        semester = "Winter";
    }
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null) {
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else{
            try{
                mongoDbObj.courses.find({$and: [{Semester : semester.toString(), Year : year.toString(), CourseId: courseId.toString()}]}, {_id:0,CourseId:1,StudentList:1,ClassTime:1}).toArray(function(err1, result1){
                    if(err1){
                        throw err1;
                    }
                    else{
                        if(result1.length > 0){
                            var courseDetail = result1[0];
                            res.setHeader('Content-Type', 'application/json');
                            res.send({"Code" : "200", "StudentList" : courseDetail.StudentList});
                        }
                        else{
                            res.setHeader('Content-Type', 'application/json');
                            res.send({"Code" : "204", "StudentList" : []});
                        }
                    }
                });
            }
            catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.send({"Code" : "450", "Message" : ex.toString()});
            }
        }
    });
});

//API For Getting CourseList by ProfID
router.post('/getCourses', function (req,res,next) {
    var professorId = req.body.UserId;
    getMongoClient.mongoDbObj(function (mongoDbObj) {
        if(mongoDbObj==null) {
            res.setHeader('Content-Type', 'application/json');
            res.send({"Code" : "450", "Message" : "DataBase Connection Failed"});
        }
        else{
            try{
                mongoDbObj.courses.find({$and: [{ProfessorId: professorId.toString()}]}, {_id:0,CourseId:1,Semester:1,Year:1}).toArray(function(err1, result1){
                    if(err1){
                        throw err1;
                    }
                    else{
                        if(result1.length > 0){
                            var resultJSON = [];
                            result1.forEach(function (result) {
                                resultJSON.push({"Semester" : result.Semester, "Year" : result.Year, "CourseId" : result.CourseId});
                            });
                            res.setHeader('Content-Type', 'application/json');
                            res.send({"Code" : "200", "CourseList" : resultJSON});
                        }
                        else{
                            res.setHeader('Content-Type', 'application/json');
                            res.send({"Code" : "204", "CourseList" : []});
                        }
                    }
                });
            }
            catch(ex){
                res.setHeader('Content-Type', 'application/json');
                res.send({"Code" : "450", "Message" : ex.toString()});
            }
        }
    });
});

module.exports = router;