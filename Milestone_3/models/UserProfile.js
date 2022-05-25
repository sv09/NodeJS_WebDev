// add user connection model, to add the connection and its RSVP value, chosen by the user
var uc = require('./../models/UserConnection.js');
var connection = require('./../utilities/connectionDB.js');

//global variables
var userConnec;
var connections= [];
var checkList = [];

// Class user profile to maintain a user's user ID and the list of connections selected by the user
class UserProfile{
    constructor(userID, connections){
        this.userID = userID;
        this.connections = connections;
    }

    // function to add a new connection to the profile, that is selected by the user
    addConnection(connectionID, rsvpVal){
        var connection = require('./../utilities/connectionDB.js');
        connection = connection.getConnection(connectionID);
        userConnec = new uc(connection, rsvpVal);
        this.connections.push(userConnec);
        return this;
    }

    // function to delete an existing connection from the user's profile
    removeConnection(connectionID){
        for(var i=0; i<this.connections.length; i++){
            if(this.connections[i].connection.connectionID === connectionID){
                var rem = this.connections.splice(i,1);
                return this;
            }
        }
    }

    // function to update the RSVP value of an existing connection in the profile, if the user clicks on another RSVP value
    updateRSVP(connectionID, rsvpVal){
        for(var j=0; j<this.connections.length; j++){
            if(this.connections[j].connection.connectionID === connectionID){
                this.connections[j].rsvp = rsvpVal;
            }
        }
        return this;
    }

    // to clear out all the data stored in the class properties after sign-out
    emptySession(){
        this.userID = '';
        this.connections=[];

        return this;
    }

    // function to return the connections list stored in a user's profile
    getUserConnections(){
        return this.connections;
    }

    // function to return a user's user ID
    getUserDetails() {
        return {
          userID: this.userID,
        }
    }
};

module.exports = UserProfile;