class connection{
    constructor(data){
        this.connectionID = data.connectionID;
        this.connectionTopic = data.connectionTopic;
        this.connectionName = data.connectionName;
        this.host = data.host;
        this.date = data.date;
        this.time = data.time;
        this.location = data.location;
        this.details = data.details;
    }

getcID(){
    return this.connectionID;
}
setcID(cid){
    this.connectionID=cid;
}

getcTopic(){
    return this.connectionTopic;
}
setcTopic(ct){
    this.connectionTopic=ct;
}

getcName(){
    return this.connectionName;
}
setcName(cn){
    this.connectionName=cn;
}

gethst(){
    return this.host;
}
sethst(ht){
    this.host=ht;
}

getdte(){
    return this.date;
}
set dte(dt){
    this.date=dt;
}

gettim(){
    return this.time;
}
settim(tm){
    this.time=tm;
}

getloc(){
    return this.location;
}
setloc(lc){
    this.location=lc;
}

getdls(){
    return this.details;
}
setdls(cd){
    this.details=cd;
}

};

module.exports = connection;

