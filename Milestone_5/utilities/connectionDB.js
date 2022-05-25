//require mongoose
var mongoose = require('mongoose');

//add connection class
var makeConn = require('../models/connection.js');

//connect to db
mongoose.connect('mongodb://localhost/milestone', {useNewUrlParser: true, useUnifiedTopology: true});


//reference to db
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection.error'));
db.once('open', function(){
    console.log('Connected to db successfully');
});

//schema for connections
var connectionSchema = new mongoose.Schema({
    connectionID: {type: String, required: true},
    connectionTopic: {type: String, required: true},
    connectionName: {type: String, required: true},
    host: {type: String, required: true},
    date: {type: String, required: true},
    startTime: {type: String, required: true},
    endTime: {type: String, required:true},
    location: {type: String},
    details: {type: String}
});

//compile schema to model
var connections = mongoose.model('connections', connectionSchema);


//Function to get all the connections category-wise
var getConnections = async function(){
    var categories = [];
    var object = [];
    await connections.find().then(function(docs){ //get documents from the db
        docs.forEach(function(doc){
            var obj = new makeConn(doc); //get new connection using class objects
            object.push(obj);
            var category = obj.connectionTopic;
            categories.push(category);
        });
    });
    let catConnections = {};
    categories.forEach(cat => {
	catConnections[cat] = object.filter(ob => ob.connectionTopic === cat);
    });
    return catConnections;
}; 

//Function to get a particular connection corresponding to its connection ID that is passed as parameter
var getConnection = async function(id){
    var data = null;
    await connections.find({connectionID: id}).then(function(docs){ //get documents from the db
        docs.forEach(function(doc){
            var obj = new makeConn(doc); //get new connection using class objects
            if(id === obj.connectionID){
                data = obj;
            }
            else{
                data = null;
            }
        });
    });
    return data; 
};

//function to create a connection ID for a new connection added 
var getConnectionID = async function(){
    var count = await connections.countDocuments();
    var connecID = ('connection' + (count+1));
    //console.log(connecID);
    return connecID;
};


module.exports.getConnections = getConnections;
module.exports.getConnection = getConnection;
module.exports.getConnectionID = getConnectionID;
//module.exports = connections;