// Class to set properties of a user
class User{
    constructor(userID, firstName, lastName, email){
        this.userID = userID;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }

    get uID(){
        return this.userID;
    }
    set uID(uid){
        this.userID=uid;
    }

    get fname(){
        return this.firstName;
    }
    set fname(fn){
        this.firstName=fn;
    }

    get lname(){
        return this.lastName;
    }
    set lname(ln){
        this.lastName=ln;
    }

    get emailID(){
        return this.email;
    }
    set emailID(eml){
        this.email=eml;
    }

    getUserDetails() {
        return {
          userID: this.userID,
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email
        };
      }
};

module.exports = User;