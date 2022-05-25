var express = require('express');
var router = express.Router();


router.get('/', function(req, res){
    // res.render('savedConnections', {userData: req.session.user});
    res.render('index', {userData: req.session.user});
});


module.exports = router;