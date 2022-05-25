var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
    var connections = require('./../utilities/connectionDB.js');
    connections = connections.getConnections();
    res.render('connections', {connections: connections});
});

router.get('/connection/:connectionID', function(req, res){
    var connection = require('./../utilities/connectionDB.js');
    connection = connection.getConnection(req.params.connectionID);
    if(connection){
        res.render('connection', {connection : connection});
    }else{                                                           //to handle page if incorrect connection ID is provided in the URL
        connection = require('./../utilities/connectionDB.js');
        connections = connection.getConnections();
        res.render('connections', {connections: connections});    
   }
});

//Adding wildcard route to handle URLs which may have random text after /
router.get('/*', function(req, res){
    var connections = require('./../utilities/connectionDB.js');
    connections = connections.getConnections();
    res.render('connections', {connections: connections});
});

module.exports = router;