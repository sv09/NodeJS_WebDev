class connection{
    constructor(data){
        this.connectionID = data.connectionID;
        this.connectionName = data.connectionName;
        this.connectionTopic = data.connectionTopic;
        this.details = data.detail;
        this.date = data.date;
        this.time = data.time;
        this.location = data.location;
        this.host = data.host;
    }

get cID(){
    return this.connectionID;
}
set cID(cid){
    this.connectionID=cid;
}

get cName(){
    return this.connectionName;
}
set cName(cn){
    this.connectionName=cn;
}

get cTopic(){
    return this.connectionTopic;
}
set cTopic(ct){
    this.connectionTopic=ct;
}

get dls(){
    return this.details;
}
set dls(cd){
    this.details=cd;
}

get dte(){
    return this.date;
}
set dte(dt){
    this.date=dt;
}

get tim(){
    return this.time;
}
set tim(tm){
    this.time=tm;
}

get loc(){
    return this.location;
}
set loc(lc){
    this.location=lc;
}

get hst(){
    return this.host;
}
set hst(ht){
    this.host=ht;
}
};

module.exports = connection;

