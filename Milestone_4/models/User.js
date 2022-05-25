// Class to set properties of a user
class User{
    constructor(userID, firstName, lastName, email){
        this.userID = userID;
        this.firstName = firstName;
        this.lastName = lastName;
        this.emailID = email;
    }

    getuID(){
        return this.userID;
    }
    setuID(uid){
        this.userID=uid;
    }

    getfname(){
        return this.firstName;
    }
    setfname(fn){
        this.firstName=fn;
    }

    getlname(){
        return this.lastName;
    }
    setlname(ln){
        this.lastName=ln;
    }

    getemail(){
        return this.emailID;
    }
    setemail(eml){
        this.emailID=eml;
    }

    getUserDetails() {
        return {
          userID: this.userID,
          firstName: this.firstName,
          lastName: this.lastName,
          emailID: this.emailID
        };
      }
};

module.exports = User;