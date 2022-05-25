var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
    res.render('about', {userData: req.session.user});
});

module.exports = router;