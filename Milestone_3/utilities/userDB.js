// add user Model
var userModel = require('./../models/User.js');

data = {
    userID: 'US01',
    firstName:'Rachel',
    lastName:'Lee',
    email:'rachlee@test.com'
    }

// Class to assign the username entered by a user as a user property  - calls a userModel object of the class 'User'
class userDB{
    constructor(username){
        this.userID = username;
    }

    getUserData = function(){
        var user = new userModel(this.userID, this.userID, 'Doe', 'test@test.com');
        return user;
    }
}

module.exports = userDB;