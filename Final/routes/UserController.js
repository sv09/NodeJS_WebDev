var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var util = require('util');
//var popupS = require('popups');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var bodyParserJson = bodyParser.json();
const{check, validationResult, body, param} = require('express-validator');
//add bcryptjs
var bcrypt = require('bcryptjs');

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
var userinviteDB = require('./../utilities/userInviteDB.js');

//get current date for validation
var dt = new Date();

//variable to store the invited users 
var invitedUsers = {};

// #Render the sign-up page
// router.get('/signup', urlencodedParser, async function(req, res, next){
//     res.render('signup');
// });

// #Render the login page
router.get('/login', urlencodedParser, function(req,res,next){
    res.render('login', {userData: req.session.user});
});

// #Route to login page after sign up
router.post('/login', urlencodedParser, body('cPassword', 'email'),
[check('firstName')
.isAlpha().withMessage('Enter first name in alphabets'),
check('lastName')
.isAlpha().withMessage('Enter last name in alphabets'),
check('email')
.isEmail().withMessage('Enter a valid email ID')
.normalizeEmail()
.custom(async function(value, {req}){
    var result = await userDB.checkIfEmailUnique(req.body.email);
    if(Boolean(result) === 'true') {
        throw new Error('Email ID already in use. Please enter a different email ID.')
    }
    return true;
}).withMessage('Email ID already in use. Please enter a different email ID.'),
check('sPassword')
.isLength({min: 4}).withMessage("Password must contain atleast 4 characters.")
.matches(("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])")).withMessage('Include atleast one lowercase alphabet, one uppercase alphabet, one number, and atleast one special character out of: !@#$%^&* in your password.'),
check('cPassword')
.custom((value, {req}) => {
    if(value !== req.body.sPassword){
        throw new Error('Password confirmation not successful. Please try again.');
    }
    return true;
}).withMessage('Password confirmation not successful. Please try again.')],
async function(req, res, next){
    const errors = validationResult(req);
    if(errors.isEmpty()){
        var newUser = new userModel(req.body.email, req.body.firstName, req.body.lastName, req.body.email, req.body.sPassword);
        var reslt = await userDB.addNewUser(newUser);
        if(reslt != ''){
            res.render('login', {userData: req.session.user});
        }else{
            var userExists = true;
            res.render('signup', {user: userExists});
        }
    }else{
        var errArr = [];
        errObj = errors.errors;
        errObj.forEach(function(err){
        errArr.push(err.msg);
        });
        console.log('errors = ', errors);
        res.render('signup', {err: errArr});
    }
    
});

// #Handling GET request for '/user/savedConnections' url
router.get('/savedConnections', async function(req,res,next){
    var connections = [];
    var checkList = [];
    var invites = [];
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
        res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user, userInvite: req.session.invites});
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
.matches(("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])")).withMessage('Include atleast one lowercase alphabet, one uppercase alphabet, one number, and atleast one special character out of: !@#$%^&* in your password.')],
async function(req,res,next){
    var connections = [];
    var checkList = [];
    var invites=[];
    var userID = '';
    const errors = validationResult(req);
    if(errors.isEmpty()){
        if(req.body.username != '' && req.body.password != ''){
            nUser = await userDB.getUser(req.body.username); //call to userDB to verify username
                if(nUser != ''){
                    var passwordHash = nUser.password;
                    await bcrypt.compare(req.body.password, passwordHash).then(async function(isMatch){ //valid username returned from db, now verify password
                        if(isMatch){ 
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
                            invites = await userinviteDB.getAllInvitations(userID);

                            //check if the user already has added the connection they are invited to, if yes, then remove from the invites list 
                            if(invites.length !== 0){
                                for(var i=0; i<invites.length; i++){
                                    if(req.session.checkList.includes(invites[i].connectionID)){
                                        var rem = invites.splice(i,1);
                                    }
                                }
                            }
                            req.session.invites = invites;
                            res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user, userInvite: req.session.invites});
                        }else{
                            var pswd = false;
                            res.render('login',{password: pswd, userData: req.session.user});
                        }
                    });
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
        var invites = req.session.invites;
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
                            //update invitation list after the user responds to a connection
                            var invites = req.session.invites;
                            console.log('invites = ', invites);
                            if(typeof invites != 'undefined'){
                                if(invites.length !== 0){
                                    console.log('req.params.connectionID = ', req.params.connectionID);
                                    for(var i=0; i<req.session.invites.length; i++){
                                        console.log('req.session.invites[i].connectionID = ', req.session.invites[i].connectionID);
                                        if(req.session.invites[i].connectionID === req.params.connectionID){
                                            var rem = invites.splice(i,1);
                                            req.session.invites = invites;
                                            console.log('req.session.invites after RSVP = ', req.session.invites);
                                            console.log('req.session.user.userID = ', req.session.user.userID);
                                            console.log('req.params.connectionID = ', req.params.connectionID);
                                            await userinviteDB.removeConnection(req.session.user.userID, req.params.connectionID);//update the db
                                        }
                                    }
                                }
                            }

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
                //update invitation list after the user responds to a connection
                var invites = req.session.invites;
                console.log('invites = ', invites);
                if(typeof invites != 'undefined'){
                    if(invites.length !== 0){
                        console.log('req.params.connectionID = ', req.params.connectionID);
                        for(var i=0; i<req.session.invites.length; i++){
                            console.log('req.session.invites[i].connectionID = ', req.session.invites[i].connectionID);
                            if(req.session.invites[i].connectionID === req.params.connectionID){
                                var rem = invites.splice(i,1);
                                req.session.invites = invites;
                                await userinviteDB.removeConnection(req.session.user.userID, req.params.connectionID);//update the db
                            }
                        }
                    }
                }      
                userProf = new userProfile(req.session.user.userID, connections);
            }
            req.session.profile = userProf;
            res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user, userInvite: req.session.invites});
        //IF A CONNECTION IS ALREADY ADDED BY THE USER
        }else if(connection != null && req.session.checkList.includes(req.params.connectionID)){
            req.session.profile = userProf;
            res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user, userInvite: req.session.invites});
        }
        else{
            var cns = await connectionDB.getConnections();
            if(connection != null){
                res.render('connections', {connections: cns, userData: req.session.user, userInvite: req.session.invites, userInvite: req.session.invites}); 
            }else{
                const errors = validationResult(req);
                res.render('connections', {connections: cns, userData: req.session.user, err: errors, userInvite: req.session.invites}); 
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
        res.render('connection', {connection: connection, userData: req.session.user, numPeople: numPeople, userInvite: req.session.invites}); 
    }else{
        var connections = await connectionDB.getConnections();
        if(connection != null){
            res.render('connections', {connections: connections, userData: req.session.user, userInvite: req.session.invites});
        }else{
            const errors = validationResult(req);
            res.render('connections', {connections: connections, userData: req.session.user, err: errors, userInvite: req.session.invites});
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
                res.render('connections', {connections: connections, userData: req.session.user, userInvite: req.session.invites});
            }else{
                const errors = validationResult(req);
                res.end();
                res.render('connections', {connections: connections, userData: req.session.user, err: errors, userInvite: req.session.invites});
            }
        }
        req.session.profile = userProf;
        res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user, userInvite: req.session.invites});
    }else{
        res.render('login', {userData: req.session.user});
    }
    
});


// #Render the newConnections page
router.get('/newConnection', urlencodedParser, async function(req,res,next){
    res.render('newConnection', {userData: req.session.user, userInvite: req.session.invites});
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
                await userProfileDB.addNewConnection(connection); //call to userProfileDB to add the new connection to db
                res.render('newConnection', {value: value ,userData: req.session.user, conn: connection, userInvite: req.session.invites});
            }
            else{
                var error = true;
                res.render('newConnection', {error: error ,userData: req.session.user, userInvite: req.session.invites});
            }
        }else{
            var errArr = [];
            errObj = errors.errors;
            errObj.forEach(function(err){
                errArr.push(err.msg);
            });
            res.render('newConnection', {errors: errArr ,userData: req.session.user, userInvite: req.session.invites});   
        }
    }else{
        res.render('login', {userData: req.session.user});
    }
});

// Render the invite page
router.get('/invite/:connectionID', urlencodedParser, async function(req, res, next){
    if(typeof req.session.user != 'undefined'){
        var userEvents = [];
        var users = await userDB.getAllUsers();
        var connection = await connectionDB.getConnection(req.params.connectionID);
        res.render('invite', {userData: req.session.user, users: users, conn: connection, userInvite: req.session.invites});
    }else{
        res.render('login', {userData: req.session.user});
    }
});

// #Route to send invites to the selected users
router.post('/invite/:connectionID', urlencodedParser, bodyParserJson, async function(req, res, next){
    if(typeof req.session.user != 'undefined'){
        var users = await userDB.getAllUsers();
        var check = req.body.user;
        if(typeof check === 'string'){
            var user = [];
            user.push(req.body.user);
        }else{
            var user = req.body.user;
        }
        var connection = await connectionDB.getConnection(req.params.connectionID);
        if(user != null){
            var usersInConnection = await userProfileDB.getUsersConnection(req.params.connectionID);
            for(var i=0; i<user.length; i++){
                if(!usersInConnection.includes(user[i])){
                    await userinviteDB.inviteUser(user[i], req.params.connectionID);
                    }
            }
            var inviteSent = true;
            res.render('invite', {userData: req.session.user, users: users, conn: connection, userInvite: req.session.invites, inviteSent: inviteSent}); 
        }
    }else{
        res.render('login', {userData: req.session.user});
    }
});

// #Route to open the user's pending invitations
router.all('/notification', urlencodedParser, async function(req, res, next){
    if(typeof req.session.user != 'undefined'){
        var connections = []
        var invites = await userinviteDB.getAllInvitations(req.session.user.userID);
        req.session.invites = invites;
        //console.log('invites =', req.session.invites);
        if(invites !=null){
            for(var i=0; i<invites.length; i++){
                var conn = await connectionDB.getConnection(invites[i].connectionID);
                connections.push(conn);
            }
        }
        res.render('notification', {userData: req.session.user, connections: connections, userInvite: req.session.invites});
    }else{
        res.render('login');
    }
});


// #Render the edit connection page
router.get('/editConnection/:connectionID', urlencodedParser, async function(req, res, next){
    if(typeof req.session.user != 'undefined'){
        var connectionID = req.params.connectionID;
        var connection = await connectionDB.getConnection(connectionID);
        res.render('editConnection', {userData: req.session.user, conn: connection, userInvite: req.session.invites});
    }else{
        res.render('login');
    }
});


// #Route to submit the edits to be saved in the db
router.post('/editConnection/:connectionID', urlencodedParser, 
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
async function(req, res, next){
    //IF USER IS LOGGED IN
    if(typeof req.session.user != 'undefined'){
        var existingConn = await connectionDB.getConnection(req.params.connectionID);
        if(existingConn !== null){
            var data = {
                connectionID: existingConn.connectionID,
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
                    var exists = true;
                    var connection = new connectionModel(data);
                    var result = await userProfileDB.addNewConnection(connection); //call to userProfileDB to edit the connection to db
                    res.render('editConnection', {exists: exists ,userData: req.session.user, conn: connection, userInvite: req.session.invites});
                }else{
                    var error = true;
                    res.render('editConnection', {error: error ,userData: req.session.user, conn: connection, userInvite: req.session.invites});
                }
            }else{
                var errArr = [];
                errObj = errors.errors;
                errObj.forEach(function(err){
                    errArr.push(err.msg);
                });
                var connection = new connectionModel(data);
                res.render('editConnection', {errors: errArr ,userData: req.session.user, conn: connection, userInvite: req.session.invites});   
            }
        }else{
            var connections = await connectionDB.getConnections();
            res.render('connections', {connections: connections, userData: req.session.user, userInvite: req.session.invites});
        }
    }else{
        res.render('login', {userData: req.session.user});
        }
});


// #Route to delete a connection
router.get('/deleteConnection/:connectionID', urlencodedParser, async function(req, res, next){
    if(typeof req.session.user != 'undefined'){
        //delete from user's profile, if the connection was added
        var connection = await connectionDB.getConnection(req.params.connectionID);
        if(req.session.profile.connections.includes(connection)){
            for(var i=0; i<req.session.profile.connections.length; i++){
                if(req.session.profile.connections[i].connection.connectionID === req.params.connectionID){
                    req.session.profile.connections.splice(i, 1);
                }
            }
        }

        //delete the connection from the 'connections' collection in db
        await connectionDB.deleteConnection(req.params.connectionID);

        //delete the connection from 'userconnections' collection in db
        var users = await userProfileDB.getUsersConnection(req.params.connectionID);
        if(users.length !== 0){
            for(var i=0; i<users.length; i++){
                await userProfileDB.deleteConnection(users[i], req.params.connectionID);
            }
        }

        //delete from the invite list, if the user was invited to the connection
        var invitedUsers = await userinviteDB.getUsersInvitedToConnection(req.params.connectionID);
        if(invitedUsers.length !== 0){
            for(var i=0; i<invitedUsers.length; i++){
                await userinviteDB.removeConnection(invitedUsers[i], req.params.connectionID);
            }
        }

        var connections = await connectionDB.getConnections();
        res.render('connections', {connections: connections, userData: req.session.user, userInvite: req.session.invites});                     
    }else{
        res.render('login');
    }
});


// #Sign-out - Clear session
router.all('/signout', urlencodedParser, function(req,res,next){
    var checkList = req.session.checkList;
    var userProf = req.session.profile;
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