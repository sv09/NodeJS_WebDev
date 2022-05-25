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
var connectionModel = require('./../models/connection.js');

// #add connectionDB model
var connectionDB = require('./../utilities/connectionDB.js');
var userProfileDB = require('./../utilities/UserProfileDB.js');



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
router.post('/savedConnections', urlencodedParser, async function(req,res,next){
    var connections = [];
    var checkList = [];
    var userID = '';
    if(req.body.username != '' || req.body.password != ''){
        nUser = await userDB.getUser(req.body.username); //call to userDB
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
    
    // #if no username-password entered - login with hardcoded name
    }else{
        nUser = await userDB.getUser('Shreya'); //call to userDB
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
    }

    // }else{
    //     res.render('login',{userData: req.session.user});
    // }
    var userProf = new userProfile(userID, connections);
    req.session.profile = userProf;
    req.session.checkList = checkList;
    res.render('savedConnections', {uc: req.session.profile.connections, userData: req.session.user});
});


// #Route to saved connections page after RSVPing on a connection
router.all('/:connectionID/savedConnections',urlencodedParser, async function(req,res,next){
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
            res.render('connections', {connections: cns, userData: req.session.user});  
        }
    }else{
        res.render('login', {userData: req.session.user});
        }
});

// #Route to connection page to update RSVP value
router.all('/connections/connection/:connectionID', urlencodedParser, async function(req,res,next){
    var checkList = req.session.checkList;
    var userProf = req.session.profile;
   
    var numPeople = await userProfileDB.getNumUsers(req.params.connectionID); 
    var connection = await connectionDB.getConnection(req.params.connectionID); //call to connectionDB function to fetch data from the db
    if(connection != null){
        req.session.profile = userProf;
        res.render('connection', {connection: connection, userData: req.session.user, numPeople: numPeople}); 
    }else{
        var connections = await connectionDB.getConnections();
        res.render('connections', {connections: connections, userData: req.session.user});
    }
});


// #Delete a connection from savedConnections
router.all('/:connectionID/delete/savedConnections', urlencodedParser, async function(req,res,next){
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
            res.render('connections', {connections: connections, userData: req.session.user});
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
router.post('/newConnection', urlencodedParser, async function(req,res,next){
    //IF USER IS LOGGED IN
    if(typeof req.session.user != 'undefined'){
        var newConnectionID = await connectionDB.getConnectionID();
        var data = {
            connectionID: newConnectionID,
            connectionTopic: req.body.topic,
            connectionName: req.body.name,
            host: req.session.user.firstName,
            date: req.body.when,
            time: req.body.time,
            location: req.body.where,
            details: req.body.details
        };

        if(data.connectionID != null && data.connectionTopic != '' && data.connectionName != '' && data.host != '' && data.date != '' && data.time != ''){
            var value = true;

            var connection = new connectionModel(data);
            await userProfileDB.addNewConnection(connection); //call to userProfileDB to add the new connection to db
        
            res.render('newConnection', {value: value ,userData: req.session.user});
        }
        else{
            var error = true;
            console.log("One or more of the required fields are left blank");
            res.render('newConnection', {error: error ,userData: req.session.user});
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