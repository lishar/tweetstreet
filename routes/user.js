/**
 * Module dependencies.
 */
var passport = require('passport')
	, login = require('connect-ensure-login')

/*
 * GET users listing.
 */
exports.list = function(req, res){
	res.send("respond with a resource");
};

exports.register = function(req, res){
	res.render('register');
};

exports.registerPost = function(req, res){
	
	var user = new req.app.db.models.User();
	user.email = req.body.email;
    user.name = req.body.name;
    user.password = require('crypto').createHash('md5').update(req.body.password).digest("hex");
    user.save(function(err, user){
    	if(err) { 
            if(err.code === 11000)
              res.send({'error': 'User already exists'}, 409);
            else          
              res.send(500);
          } else {        
            res.json(user);  
          }
    })
};

exports.login = function(req, res){
	res.render('login');
};

exports.logout = function(req, res){
	req.logout();
	res.redirect('/');
};

exports.request_token = function(req, res){
	res.send("respond with a resource");
};

exports.access_token = function(req, res){
	res.send("respond with a resource");
};

exports.info = [
	login.ensureLoggedIn(),
	function(req, res) {
		res.json(req.user);
	}
]