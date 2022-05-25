var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// #add user model
var userDB = require('./../utilities/userDB.js');
var userModel = require('./../models/User.js');

// #add user profile and user connection models
var userProfile = require('./../models/UserProfile.js');
var userConnection = require('./../models/UserConnection.js');

// #add connectionDB model
var conn = require('./../utilities/connectionDB.js');



// #Render the login page
router.all('/login', urlencodedParser, function(req,res,next){
    res.render('login', {userData: req.session.user});
});

// #Handling GET request for '/user/savedConnections' url
router.get('/savedConnections', function(req,res,next){
    if(typeof req.session.user != 'undefined'){
        var connections = req.session.profile.connections;
        var userID = req.session.profile.userID;
        var userProf = new userProfile(userID, connections);
        res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.profile});
    }else{
        res.render('login',{userData: req.session.user});
    }
});


// #Route to savedConnections page after login
router.post('/savedConnections', urlencodedParser, function(req,res,next){
    var connections = [];
    if(req.body.username != '' || req.body.password != ''){
        nUser = new userDB(req.body.username);
        req.session.user = nUser.getUserData();
        let userID = req.session.user.userID;
        var userProf = new userProfile(userID, connections);
        req.session.profile = userProf;
    
    // #if no username-password entered - login with hardcoded name
    // else{
    //     nUser = new userDB('Rachel');
    //     req.session.user = nUser.getUserData();
    //     let userID = req.session.user.userID;
    //     var userProf = new userProfile(userID, connections);
    //     req.session.profile = userProf;
    // }
    req.session.checkList = [];
    res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.profile});
    }else{
        res.render('login',{userData: req.session.user});
    }
});


// #Route to saved connections page after RSVPing on a connection
router.all('/:connectionID/savedConnections',urlencodedParser, function(req,res,next){
    var conn = require('./../utilities/connectionDB.js');
    var connection = conn.getConnection(req.params.connectionID);  
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
                    }else{
                        if(!req.session.checkList.includes(req.params.connectionID)){
                            userProf = userProf.addConnection(req.params.connectionID, req.body.Button);
                            checkList.push(req.params.connectionID);
                            req.session.checkList = checkList;
                        }
                    }
                }
            }else{
                userProf = userProf.addConnection(req.params.connectionID, req.body.Button);
                checkList.push(req.params.connectionID);
                req.session.checkList = checkList;
            }
            req.session.profile = userProf;
            res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.profile});
        //IF A CONNECTION IS ALREADY ADDED BY THE USER
        }else if(connection != null && req.session.checkList.includes(req.params.connectionID)){
            req.session.profile = userProf;
            res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.profile});
        }
        else{
            var cns = conn.getConnections();
            res.render('connections', {connections: cns, userData: req.session.user});  
        }
    }else{
        res.render('login', {userData: req.session.user});
        }
});

// #Route to connection page to update RSVP value
router.all('/connections/connection/:connectionID', urlencodedParser, function(req,res,next){
    var checkList = req.session.checkList;
    var userProf = req.session.profile;
    var conn = require('./../utilities/connectionDB.js');
    var connection = conn.getConnection(req.params.connectionID);
    if(connection != null){
        req.session.profile = userProf;
        res.render('connection', {connection: connection, userData: req.session.user}); 
    }else{
        var connections = conn.getConnections();
        res.render('connections', {connections: connections, userData: req.session.user});
    }
});


// #Delete a connection from savedConnections
router.all('/:connectionID/delete/savedConnections', urlencodedParser, function(req,res,next){
    var conn = require('./../utilities/connectionDB.js');
    var connection = conn.getConnection(req.params.connectionID);
    //IF USER IS LOGGED IN
    if(typeof req.session.user != 'undefined'){
        var checkList = req.session.checkList;
        var connections = req.session.profile.connections;
        var userID = req.session.profile.userID;
        var userProf = new userProfile(userID, connections);
        if(connection != null && req.session.checkList.includes(req.params.connectionID)){
            userProf = userProf.removeConnection(req.params.connectionID);
            for(var i=0; i<req.session.checkList.length; i++){
                if(req.session.checkList[i] === req.params.connectionID){
                    var rem = checkList.splice(i,1);
                    req.session.checkList = checkList;
                }
            }
        }
        // IF CONNECTION NOT VALID OR IF VALID CONNECTION, BUT NOT ADDED BY THE USER
        else{
            var connections = conn.getConnections();
            res.render('connections', {connections: connections, userData: req.session.user});
        }
        req.session.profile = userProf;
        res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.profile});
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