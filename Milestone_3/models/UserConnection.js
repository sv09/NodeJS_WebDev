class UserConnection{
    constructor(connection, rsvp){
        this.connection = connection;
        this.rsvp = rsvp;
    }

    get conn(){
        return this.connection;
    }
    set conn(conn){
        this.connection=conn;
    }

    get rsvpRes(){
        return this.rsvp;
    }
    set rsvpRes(res){
        this.rsvp=res;
    }
};

module.exports =  UserConnection;