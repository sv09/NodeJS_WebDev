// Connection data
var c =[{connectionID:'HT01', 
        connectionTopic:'Hand Tools',
        connectionName: 'Color Theory 101', 
        host: 'Jenn A', 
        date: 'Friday, February 5, 2020', 
        time: '6:00PM-7:00PM', 
        location: 'Charlotte Arts Center, N Tryon Road, 28262', 
        detail: "This event is to know the basics about color theory. If you are a beginner or a professional and want to brush up your knowledge about color theory, this will be a great opportunity to do that."
        },

        {connectionID:'HT02', 
        connectionTopic:'Hand Tools',
        connectionName: 'Sketching and Doodling', 
        host: 'Alice', 
        date: 'Monday, February 8, 2020', 
        time: '5:30PM-6:30PM', 
        location: 'Charlotte Arts Center, N Tryon Road, 28262', 
        detail: "Have fun with sketching and doodling. Any skill-level is welcome. Bring doodling pens of your choice and get wild with your imagination."
        },

        {connectionID:'HT03', 
        connectionTopic:'Hand Tools',
        connectionName: 'Modern Calligraphy', 
        host: 'Jacob', 
        date: 'Wednesday, February 10, 2020', 
        time: '6:00PM-7:00PM', 
        location: 'Charlotte Arts Center, N Tryon Road, 28262', 
        detail: "Add a touch of modern calligraphy to your style. Bring a brush tip pen that you are comfortable with. Our suggestion for beginners - Tombow brush pens."
        },

        {connectionID:'DT01', 
        connectionTopic:'Digital Tools',
        connectionName: 'Prototyping', 
        host: 'Jenn A', 
        date: 'Friday, February 12, 2020', 
        time: '6:00PM-7:00PM', 
        location: 'Charlotte Arts Center, N Tryon Road, 28262', 
        detail: "Want to convey your design ideas to others effectively? Come learn how to prototype what's in your mind and let the world know your brilliance!"
        },

        {connectionID:'DT02', 
        connectionTopic:'Digital Tools',
        connectionName: 'Adobe Illustrator', 
        host: 'Shreya', 
        date: 'Monday, February 15, 2020', 
        time: '5:00PM-7:00PM', 
        location: 'Charlotte Arts Center, N Tryon Road, 28262', 
        detail: "Learn Adobe Illustrator. This is a beginner's course, although all levels are welcome."
        },

        {connectionID:'DT03', 
        connectionTopic:'Digital Tools',
        connectionName: 'Adobe Photoshop', 
        host: 'Naomi', 
        date: 'Friday, February 5, 2020', 
        time: '6:00PM-8:00PM', 
        location: 'Charlotte Arts Center, N Tryon Road, 28262', 
        detail: "Learn Adobe Photoshop.This is a beginner's course, although all levels are welcome."
        },
        
        {connectionID:'CT01', 
        connectionTopic:'Computer Tools',
        connectionName: 'Microsoft excel', 
        host: 'Naomi', 
        date: 'Friday, February 5, 2020', 
        time: '6:00PM-8:00PM', 
        location: 'Charlotte Arts Center, N Tryon Road, 28262', 
        detail: "Learn Microsoft Excel.This is a beginner's course, although all levels are welcome."
        }]
var makeConn = require('../models/connection.js');

//Function to get all the connections category-wise
function getConnections(){
    categories = [];
    // let categories = ['Hand Tools', 'Digital Tools','Computer Tools']; // maintaining an array for all the categories that will be added. Adding a new category name here will display the changes on the connections page
    for(var i = 0; i<c.length; i++){
        var obj = new makeConn(c[i]);
        category = obj.connectionTopic
        categories.push(category)
    // console.log(categories);
    } 
    
    let catConnections = {};

    categories.forEach(cat => {
	catConnections[cat] = c.filter(obj => obj.connectionTopic === cat);
    });
    return catConnections;
};

//Function to get a particular connection corresponding to its connection ID that is passed as parameter
function getConnection(id){
    var data = null;
    // for(var i=0; i<c.length; i++){
    //     if(id === c[i].connectionID){
    //         data = c[i];
    //     }
    // }
    for(var i = 0; i<c.length; i++){
        var obj = new makeConn(c[i]);
        if(id === obj.connectionID){
            data = obj;
            return data;
        }else{
            return data;
        }
    }  
};

exports.getConnections = getConnections;
exports.getConnection = getConnection;