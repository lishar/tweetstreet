/**
 * Module dependencies.
 */
var passport = require('passport')
	, oauthorize = require('oauthorize')
	, login = require('connect-ensure-login')


// create OAuth server
var server = oauthorize.createServer();
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
	
	// TODO check params

	var user = new req.app.db.models.User();
	user.email = req.body.email;
    user.name = req.body.name;
    user.password = require('crypto').createHash('md5').update(req.body.password).digest("hex");
    user.verify = req.app.utility.uid(32);

    user.save(function(err, user){
    	if(err) { 
            if(err.code === 11000)
              res.send({'error': 'User already exists'}, 409);
            else          
              res.send(500);
          } else {
            res.json(user); 

            req.app.utility.email(req, res, {
				from: req.app.config.email.from.name +' <'+ req.app.config.email.from.address +'>',
				to: req.body.email,
				subject: 'Verify Bucket Account',
				textPath: 'email/signup-text',
				htmlPath: 'email/signup-html',
				locals: {},
				success: function(message) {
					req.app.logger.info("account.signupEmail:" + req.body.email);
				},
				error: function(err) {
					req.app.logger.error("account.signupEmail:" + req.body.email + ":" + err);
				}
			});
          }
    })
};


exports.verify = function(req, res){
	req.app.db.models.User.findOne({verify: req.query.verifyToken}, function(err, user){
		if(err) res.send(500);
		else if(user){

			user.status = 'active';
			user.save(function(err, user){
				if(err) res.send(500);
				else {

					req.app.utility.email(req, res, {
						from: req.app.config.email.from.name +' <'+ req.app.config.email.from.address +'>',
						to: user.email,
						subject: 'Welcome to Bucket',
						textPath: 'email/welcome-text',
						htmlPath: 'email/welcome-html',
						locals: {},
						success: function(message) {
							req.app.logger.info("account.welcomEmail:" + user.email);
						},
						error: function(err) {
							req.app.logger.error("account.welcomeEmail:" + user.email + ":" + err);
						}
					});
					res.json({'message': 'verified'});
				}
			});
			
		} else {
			res.json({'message': 'user not found'});
		}
	});
};

exports.resendRegisterEmail = function(req, res){
	res.render('resend-verification');
}

exports.resendRegisterEmailPost = function(req, res){
	req.app.db.models.User.findOne({email: req.body.email}, function(err, user){
		if(err) res.send(500);
		else if(user){

			req.app.utility.email(req, res, {
				from: req.app.config.email.from.name +' <'+ req.app.config.email.from.address +'>',
				to: user.email,
				subject: 'Verfiy Bucket Account',
				textPath: 'email/signup-text',
				htmlPath: 'email/signup-html',
				locals: {},
				success: function(message) {
					req.app.logger.info("account.signupEmail:" + user.email);
				},
				error: function(err) {
					req.app.logger.error("account.signupEmail:" + user.email + ":" + err);
				}
			});

			res.json({'message': 'sent'});
		} else {
			res.json({'message': 'user not found'});
		}
	});
}

exports.login = function(req, res){
	res.render('login');
};

exports.logout = function(req, res){
	req.logout();
	res.redirect('/');
};

exports.buy = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.sell = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.history = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.info = [
	login.ensureLoggedIn(),
	function(req, res) {
		res.json(req.user);
	}
]
