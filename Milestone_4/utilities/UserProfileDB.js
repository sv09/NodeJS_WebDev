var mongoose = require('mongoose');

//add userConnection class model
var userConn = require('./../models/UserConnection.js');
var connectionDB = require('./connectionDB.js');
var userProfile = require('./../models/UserProfile.js');
var connectionModel = require('./../models/connection.js');

//require mongoose
var mongoose = require('mongoose');
const Schema = mongoose.Schema;


//connect to local db
mongoose.connect('mongodb://localhost/milestone', {useNewUrlParser: true, useUnifiedTopology: true});


//mongoose schema for user connections
var userConnectionSchema = new mongoose.Schema({
    userID: {type: String, required: true},
    connectionID: {type: String, required: true},
    //connection: [{ type: Schema.Types.ObjectId, ref: 'connectionSchema'}],
    rsvp: {type: String, required: true}
});


//compile the schema to model
var userConnections = mongoose.model('userconnections', userConnectionSchema);

//require connectionSchema
var conn = mongoose.model('connections', connectionDB.connectionSchema);


//function to retrive all connections for a user
var getAllConnections = async function(userID){
    var connections = [];
    var connID = [];
    await userConnections.find({userID: userID}).then(function(docs){
        if(docs.length != 0){
            docs.forEach(doc => {
                connections.push(doc);
            });
        }
    });
return connections;
}; 

//function to update or add rsvp for a connection
var AddUpdateRSVP = async function(userID, connectionID, rsvp){
    await userConnections.find({userID: userID, connectionID: connectionID}).then(function(doc){
        if(doc.length != 0){
            var opts = { runValidators: true };
            userConnections.updateOne({userID: userID, connectionID: connectionID},{$set: {rsvp: rsvp}}, opts, function(err, res){
                if(err) return handleError(err);
                console.log('updated rsvp');
            });
        }else{
            var add = new userConnections({userID: userID, connectionID: connectionID, rsvp: rsvp});
            add.save(function(err){
                if(err) return handleError(err);
                console.log('added a connection to the user list');
            });
        }
    });
};

//function to delete a connection from the profile
var deleteConnection = async function(userID, connectionID){
    await userConnections.deleteOne({userID: userID, connectionID: connectionID}, function(err, res){ //update the change in db
        if(err) return handleError(err);
        console.log('Connection removed from userconnections. Number of connections deleted = ', res.deletedCount);
    });
};

//function to add a new connection to the list
var addNewConnection = async function(connection){
    var newConn = new conn(connection);
    var result = '';
    await newConn.save(function(err, res){
        if(err) return handleError(err);
        result = res;
        console.log('New connection added to db');
    });
    return result;
};


//function to handle error
function handleError(error) {
    console.error("One or more of the required fields are left blank");
    //process.exit();
}

//function to count number of users who have added a connection
var getNumUsers = async function(connectionID){
    var result = '';
    await userConnections.find({connectionID: connectionID}).then(function(docs){
        docs.forEach((doc) => {
            console.log('doc = ', doc);
        })
        //console.log('docs.length = ', docs.length);
        result = docs.length;
    });
    return result;
};

module.exports.getAllConnections = getAllConnections;
module.exports.AddUpdateRSVP = AddUpdateRSVP;
module.exports.addNewConnection = addNewConnection;
module.exports.deleteConnection = deleteConnection;
module.exports.getNumUsers = getNumUsers;