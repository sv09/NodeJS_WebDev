var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const{check, validationResult, body, param} = require('express-validator');

// #add user model
var userDB = require('./../utilities/userDB.js');
var userModel = require('./../models/User.js');

// #add user profile and user connection models
var userProfile = require('./../models/UserProfile.js');
var userConnection = require('./../models/UserConnection.js');
var connectionModel = require('./../models/connection.js');

// #add connectionDB model
var connectionDB = require('./../utilities/connectionDB.js');
var userProfileDB = require('./../utilities/UserProfileDB.js');

//get current date for validation
var dt = new Date();

// #Render the login page
router.all('/login', urlencodedParser, function(req,res,next){
    res.render('login', {userData: req.session.user});
});

// #Handling GET request for '/user/savedConnections' url
router.get('/savedConnections', async function(req,res,next){
    var connections = [];
    var checkList = [];
    if(typeof req.session.user != 'undefined'){
        //var connections = req.session.profile.connections;
        var userID = req.session.profile.userID;
        var c = await userProfileDB.getAllConnections(userID); //to fetch all the connections already saved by the user
        if(c.length != 0){
            for(var k=0; k<c.length; k++){
                var cn = await connectionDB.getConnection(c[k].connectionID);
                var userConn = new userConnection(cn, c[k].rsvp);
                connections.push(userConn);
                checkList.push(c[k].connectionID);
            };
        }
        var userProf = new userProfile(userID, connections);
        req.session.profile = userProf;
        req.session.checkList = checkList;
        res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user});
    }else{
        res.render('login',{userData: req.session.user});
    }
});

// #Route to savedConnections page after login
router.post('/savedConnections', urlencodedParser, 
//validate all the inputs
[check('username')
.isEmail().withMessage('Please enter a valid email ID as the username.'),
check('password')
.isLength({min: 4}).withMessage("Password must contain atleast 4 characters.")
.matches(("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])")).withMessage('Include atleast one lowercase alphabet, one uppercase alphabet, one number, and atleast one special characters out of: !@#$%^&* in your password.')],
async function(req,res,next){
    var connections = [];
    var checkList = [];
    var userID = '';
    const errors = validationResult(req);
    if(errors.isEmpty()){
        if(req.body.username != '' && req.body.password != ''){
            nUser = await userDB.getUser(req.body.username); //call to userDB to verify username
                if(nUser != ''){
                    if(req.body.password == nUser.password){ //valid username returned from db, now verify password
                        req.session.user = nUser;
                        userID = req.session.user.userID;
                        var c = await userProfileDB.getAllConnections(userID); //to fetch all the connections already saved by the user
                        if(c.length != 0){
                            for(var k=0; k<c.length; k++){
                                var cn = await connectionDB.getConnection(c[k].connectionID);
                                var userConn = new userConnection(cn, c[k].rsvp);
                                connections.push(userConn);
                                checkList.push(c[k].connectionID);
                            };
                        }
                        var userProf = new userProfile(userID, connections);
                        req.session.profile = userProf;
                        req.session.checkList = checkList;
                        res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user})
                    }else{
                        var pswd = false;
                        res.render('login',{password: pswd, userData: req.session.user});
                    }
                }else{
                    var reg = false;
                    res.render('login',{register: reg, userData: req.session.user});
                }
        }else{
            res.render('login',{userData: req.session.user});
        }
    }else{
        var errArr = [];
        errObj = errors.errors;
        errObj.forEach(function(err){
            errArr.push(err.msg);
        });
        res.render('login',{errors: errArr, userData: req.session.user});
    }
});


// #Route to saved connections page after RSVPing on a connection
router.all('/:connectionID/savedConnections',urlencodedParser, 
[param('connectionID') //validate the connection ID
.isLength({min: 11})
.isLength({max: 12})
.matches(/^[connection\d]*$/, 'g').withMessage("Invalid connection ID passed. Please select a valid connection from the list.")
],
async function(req,res,next){
    var connection = await connectionDB.getConnection(req.params.connectionID);  
    //IF USER IS LOGGED IN
    if(typeof req.session.user != 'undefined'){
        var checkList = req.session.checkList;
        var connections = req.session.profile.connections;
        var userID = req.session.profile.userID;
        var userProf = new userProfile(userID, connections);
        //IF REQUEST RECEIVED BY CLICKING ON RSVP BUTTON
        if(connection != null && req.body.Button != null){
            var userConnections = userProf.getUserConnections();
            if(userConnections.length > 0){
                for(var i=0; i<userConnections.length; i++){
                    if(userConnections[i].connection.connectionID === req.params.connectionID && userConnections[i].rsvp != req.body.Button){
                        userProf = userProf.updateRSVP(req.params.connectionID, req.body.Button);
                        await userProfileDB.AddUpdateRSVP(req.session.user.userID, req.params.connectionID, req.body.Button);//update the db
                    }else{
                        if(!req.session.checkList.includes(req.params.connectionID)){
                            userProf = userProf.addConnection(req.params.connectionID, req.body.Button);
                            checkList.push(req.params.connectionID);
                            req.session.checkList = checkList;
                            await userProfileDB.AddUpdateRSVP(req.session.user.userID, req.params.connectionID, req.body.Button);//update the db
                           
                            userProf = new userProfile(req.session.user.userID, connections);
                        }
                    }
                }
            }else{
                userProf = userProf.addConnection(req.params.connectionID, req.body.Button);
                checkList.push(req.params.connectionID);
                req.session.checkList = checkList;
                await userProfileDB.AddUpdateRSVP(req.session.user.userID, req.params.connectionID, req.body.Button);//update the db
            
                var c = await userProfileDB.getAllConnections(req.session.user.userID); //get all connections added in the user's profile from the db
                for(var k=0; k<c.length; k++){
                    var cn = await connectionDB.getConnection(c[k].connectionID);
                    var userConn = new userConnection(cn, c[k].rsvp);
                    connections.push(userConn);
                    checkList.push(c[k].connectionID);
                };
                userProf = new userProfile(req.session.user.userID, connections);
            }
            req.session.profile = userProf;
            res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user});
        //IF A CONNECTION IS ALREADY ADDED BY THE USER
        }else if(connection != null && req.session.checkList.includes(req.params.connectionID)){
            req.session.profile = userProf;
            res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user});
        }
        else{
            var cns = await connectionDB.getConnections();
            if(connection != null){
                res.render('connections', {connections: cns, userData: req.session.user}); 
            }else{
                const errors = validationResult(req);
                //console.log('errors = ', errors);
                res.render('connections', {connections: cns, userData: req.session.user, err: errors}); 
            } 
        }
    }else{
        res.render('login', {userData: req.session.user});
        }
});

// #Route to connection page to update RSVP value
router.all('/connections/connection/:connectionID', urlencodedParser, 
[param('connectionID') //validate the connection ID
.isLength({min: 11})
.isLength({max: 12})
.matches(/^[connection\d]*$/, 'g').withMessage("Invalid connection ID passed. Please select a valid connection from the list.")
],
async function(req,res,next){
    var checkList = req.session.checkList;
    var userProf = req.session.profile;
   
    var numPeople = await userProfileDB.getNumUsers(req.params.connectionID); 
    var connection = await connectionDB.getConnection(req.params.connectionID); //call to connectionDB function to fetch data from the db
    if(connection != null){
        //convert 24-hour to 12-hour time
        var stH = connection.startTime.substring(0,2);
        if(parseInt(stH) >= 12){
            stH = parseInt(stH)-12;
            if(stH == 0){
                stH = '12';
            }else if(stH < 10){
                stH = '0' + stH;
            }
            connection.startTime = stH + ':' + connection.startTime.substring(3,5) + 'PM';
        }else if(connection.startTime.substring(5,7) != ''){
            connection.startTime = connection.startTime.substring(0,2) + ':' + connection.startTime.substring(3,5) + connection.startTime.substring(5,7);
        }else{
            connection.startTime = connection.startTime.substring(0,2) + ':' + connection.startTime.substring(3,5) + 'AM';
        }
        var etH = connection.endTime.substring(0,2);
        if(parseInt(etH) >= 12){
            etH = parseInt(etH)-12;
            if(etH == 0){
                etH = '12';
            }else if(etH < 10){
                etH = '0' + etH;
            }
            connection.endTime = etH + ':' + connection.endTime.substring(3,5) + 'PM';
        }else if(connection.endTime.substring(5,7) != ''){
            connection.endTime = connection.endTime.substring(0,2) + ':' + connection.endTime.substring(3,5) + connection.endTime.substring(5,7);
        }else{
            connection.endTime = connection.endTime.substring(0,2) + ':' + connection.endTime.substring(3,5) + 'AM';
        }
        req.session.profile = userProf;
        res.render('connection', {connection: connection, userData: req.session.user, numPeople: numPeople}); 
    }else{
        var connections = await connectionDB.getConnections();
        if(connection != null){
            res.render('connections', {connections: connections, userData: req.session.user});
        }else{
            const errors = validationResult(req);
            //console.log('errors = ', errors);
            res.render('connections', {connections: connections, userData: req.session.user, err: errors});
        }
    }
});


// #Delete a connection from savedConnections
router.all('/:connectionID/delete/savedConnections', urlencodedParser, 
[param('connectionID') //validate the connection ID
.isLength({min: 11})
.isLength({max: 12})
.matches(/^[connection\d]*$/, 'g').withMessage("Invalid connection ID passed. Please select a valid connection from the list.")
],
async function(req,res,next){
    var connection = await connectionDB.getConnection(req.params.connectionID);
    //IF USER IS LOGGED IN
    if(typeof req.session.user != 'undefined'){
        var checkList = req.session.checkList;
        var connections = req.session.profile.connections;
        var userID = req.session.user.userID;
        var userProf = new userProfile(userID, connections);
        if(connection != null && req.session.checkList.includes(req.params.connectionID)){
            userProf = userProf.removeConnection(req.params.connectionID);
            for(var i=0; i<req.session.checkList.length; i++){
                if(req.session.checkList[i] === req.params.connectionID){
                    var rem = checkList.splice(i,1);
                    req.session.checkList = checkList;
                    await userProfileDB.deleteConnection(req.session.user.userID, req.params.connectionID); //call to userProfileDB function to update the db
                }
            }
        }
        // IF CONNECTION NOT VALID OR IF VALID CONNECTION, BUT NOT ADDED BY THE USER
        else{
            var connections = await connectionDB.getConnections();
            if(connection != null){
                res.end();
                res.render('connections', {connections: connections, userData: req.session.user});
            }else{
                const errors = validationResult(req);
                //console.log('errors = ', errors);
                res.end();
                res.render('connections', {connections: connections, userData: req.session.user, err: errors});
            }
        }
        req.session.profile = userProf;
        res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user});
    }else{
        res.render('login', {userData: req.session.user});
    }
    
});


// #Render the newConnections page
router.get('/newConnection', urlencodedParser, function(req,res,next){
    res.render('newConnection', {userData: req.session.user});
});

// #create a new connection and add to the list
router.post('/newConnection', urlencodedParser, body('startTime', 'endTime'),
//validate all the inputs
[check('topic')
.matches(/^[a-zA-Z\d\_\-\s]*$/, 'g').withMessage("No other special characters, other than space or hiphen to be entered for the 'Topic'."),
check('name')
.matches(/^[a-zA-Z\d\_\-\s]*$/, 'g').withMessage("No other special characters, other than space or hiphen to be entered for the 'Name' of an event."),
check('details')
.isLength({min: 4}).withMessage("Describe the event details using atleast 4 characters.")
.matches(/^[a-zA-Z\d\_\-\s?.!,':]*$/, 'g').withMessage("For 'Details', acceptable special characters are: - _ : ! . , ' ? 'space'"),
check('where')
.matches(/^[a-zA-Z\d\_\-\s?.!,:]*$/, 'g').withMessage("For 'Location', acceptable special characters: - _ :  ! . , ? 'space'"),
check('when')
.isISO8601('yyyy-mm-dd').withMessage("Invalid date format.")
.isAfter(dt.toString()).withMessage("Enter a date greater than the current date."),
check('startTime')
.isString()
.matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'g').withMessage("Invalid format of time entered for 'Starts'. Enter 2 digits for hours and minutes each, total of 5 characters. E.g. 05:30 or 13:10.")
.custom((value, {req}) => {
    if(parseInt(req.body.startTime.substring(0,2))  > parseInt(req.body.endTime.substring(0,2))){
        throw new Error("Start time cannot be greater than the end time.");
    }
    return true;
}).withMessage("Start time cannot be greater than end time."),
check('endTime')
.isString()
.matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'g').withMessage("Invalid format of time entered for 'Ends'. Enter 2 digits for hours and minutes each, total of 5 characters. E.g. 05:30 or 13:10.")
],
async function(req,res,next){
    //IF USER IS LOGGED IN
    if(typeof req.session.user != 'undefined'){
        var newConnectionID = await connectionDB.getConnectionID();
        var data = {
            connectionID: newConnectionID,
            connectionTopic: req.body.topic,
            connectionName: req.body.name,
            host: req.session.user.firstName,
            date: req.body.when,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            location: req.body.where,
            details: req.body.details
        };
        const errors = validationResult(req);
        if(errors.isEmpty()){
            if(data.connectionID != null && data.connectionTopic != '' && data.connectionName != '' && data.host != '' && data.date != '' && data.startTime != '' && data.endTime != ''){
                var value = true; 
                var connection = new connectionModel(data);
                console.log('new connection = ', connection);
                await userProfileDB.addNewConnection(connection); //call to userProfileDB to add the new connection to db
                res.render('newConnection', {value: value ,userData: req.session.user});
            }
            else{
                var error = true;
                res.render('newConnection', {error: error ,userData: req.session.user});
            }
        }else{
            var errArr = [];
            errObj = errors.errors;
            errObj.forEach(function(err){
                errArr.push(err.msg);
            });
            res.render('newConnection', {errors: errArr ,userData: req.session.user});   
        }
    }else{
        res.render('login', {userData: req.session.user});
    }
});

// #Sign-out - Clear session
router.all('/signout', urlencodedParser, function(req,res,next){
    var checkList = req.session.checkList;
    var userProf = req.session.profile;
    // userProf = userProf.emptySession();
    req.session.profile = userProf;
    req.session.destroy(function(err){
        if(err){
            console.log('Error deleting session');
        }
        res.end();
        // next();
    });
    res.render('index')
});

module.exports = router;