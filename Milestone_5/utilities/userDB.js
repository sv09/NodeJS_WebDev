// add user Model(user class)
var userModel = require('./../models/User.js');

//require mongoose
var mongoose = require('mongoose');

//connect to local db
mongoose.connect('mongodb://localhost/milestone', {useNewUrlParser: true, useUnifiedTopology: true});

//mongoose schema for users
var userSchema = new mongoose.Schema({
    userID: {type: String, required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    emailID: {type: String, required: true},
    password: {type: String, required: true}
}); 

//compile the user schema to model
var users = mongoose.model('users', userSchema);


//function getUser to connect to db, and get user data from users collection
var getUser = async function(userID){
    var result = '';
    await users.find({userID: userID}).then(function(docs){ //gets data from the db
        docs.forEach(doc => {
            result = new userModel(doc.userID, doc.firstName, doc.lastName, doc.emailID, doc.password); //data object created using user model
        })
    });
    return result;
};

//function to handle error
function handleError(error) {
    console.error("One or more of the required fields are left blank");
    process.exit();
}

module.exports.getUser = getUser;