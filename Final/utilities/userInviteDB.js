//add userConnection class model
var userConn = require('./../models/UserConnection.js');
var connectionDB = require('./connectionDB.js');
var userProfile = require('./../models/UserProfile.js');
var connectionModel = require('./../models/connection.js');

//require mongoose
var mongoose = require('mongoose');

//connect to local db
mongoose.connect('mongodb://localhost/milestone', {useNewUrlParser: true, useUnifiedTopology: true});

//mongoose schema for user invites
var userInviteSchema = new mongoose.Schema({
    userID: {type: String, required: true},
    connectionID: {type: String, required: true},
    rsvp: {type: String}
});

//compile the schema to model
var userinvites = mongoose.model('userinvites', userInviteSchema);

//function to invite a user
var inviteUser = async function(userID, connectionID){
    var add = new userinvites({userID: userID, connectionID: connectionID});
        add.save(function(err){
            if(err) return handleError(err);
            console.log('Invited a user');
        });
};

//function to retrive all invites for a user
var getAllInvitations = async function(userID){
    var invites = [];
    var connID = [];
    await userinvites.find({userID: userID}).then(function(docs){
        if(docs.length != 0){
            docs.forEach(doc => {
                invites.push(doc);
            });
        }
    });
return invites;
}; 

//function to remove a connection from invite list, after a user responds to the connection
var removeConnection = async function(userID, connectionID){
    await userinvites.deleteOne({userID: userID, connectionID: connectionID}, function(err, res){ //update the change in db
        if(err) return handleError(err);
        console.log('Connection removed from userinvites');
    });
};

//function to get all users who are invited to a connection
var getUsersInvitedToConnection = async function(connectionID){
    var result=[];
    await userinvites.find({connectionID: connectionID}).then(function(docs){
        if(docs.length !== 0){
            docs.forEach(doc => {
                result.push(doc.userID);
            });
        }
    });
    return result;
};

module.exports.inviteUser = inviteUser;
module.exports.getAllInvitations = getAllInvitations;
module.exports.removeConnection = removeConnection;
module.exports.getUsersInvitedToConnection = getUsersInvitedToConnection;
