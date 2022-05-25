var express = require('express');
var router = express.Router();

//add DB models
var connectionDB = require('./../utilities/connectionDB.js');
var userDB = require('./../utilities/userDB.js');
var userProfileDB = require('./../utilities/UserProfileDB.js');

// #add user class models
var userModel = require('./../models/User.js');
var userProfile = require('./../models/UserProfile.js');
var userConnection = require('./../models/UserConnection.js');

router.get('/', async function(req, res){
    var connections = await connectionDB.getConnections(); //call to connectionDB function to fetch data from the db
   // console.log('connections = ', connections);
    res.render('connections', {connections: connections, userData: req.session.user});
});

router.get('/connection/:connectionID', async function(req, res){
    var numPeople = await userProfileDB.getNumUsers(req.params.connectionID); 
    var connection = await connectionDB.getConnection(req.params.connectionID); //call to connectionDB function to fetch data from the db
    //console.log('connection = ', connection);
    if(connection){
        res.render('connection', {connection : connection, userData: req.session.user, numPeople: numPeople});
    }else{                                                       //to handle page if incorrect connection ID is provided in the URL
        var connections = await connectionDB.getConnections();
        res.render('connections', {connections: connections, userData: req.session.user});    
   }
});

//Adding wildcard route to handle URLs which may have random text after /
router.get('/*', async function(req, res){
    var connections = await connectionDB.getConnections();
    res.render('connections', {connections: connections, userData: req.session.user});
});

module.exports = router;