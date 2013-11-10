/**
 * Module dependencies.
 */
var passport = require('passport')
	, oauthorize = require('oauthorize')
	, login = require('connect-ensure-login')
	, hashtag = require('./hashtag')


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
	if(!req.user) {
		res.send (401);
		return;
	}

	var transaction = new req.app.db.models.Transaction();
	transaction.name = req.params.hashtag;
	transaction.shares = req.query.shares;
	
	transaction.type = "buy";
	hashtag.price(req, req.params.hashtag, function(err, price) {
		transaction.price = price;

		req.app.db.models.Portfolio.findOne({owner: req.user._id}, function(err, portfolio){
			if(err) console.log(err);
			else {

				if(portfolio.balance < transaction.shares * transaction.price){
					res.send(402);
					return;
				}

				portfolio.balance -= transaction.shares * transaction.price
				portfolio.transactions.push(transaction);
				var found = false;
				portfolio.totals.forEach(function(v, k){
					if(v.name == transaction.name){
						v.shares += transaction.shares;
						found = true;
					}
				});
				
				if(!found) {
					portfolio.totals.push({"name": transaction.name, "shares": transaction.shares});
				}		
				
				portfolio.save(function(err, portfolio){
					if(err) console.log(err);
					else {
						hashtag.totalPurchased(req, transaction.name, transaction.shares, function(err){
							if(err) res.send(500);
							res.json(portfolio);	
						})						
					}
				})
			}
		})
	});
};

exports.sell = function(req, res){
 
  	if(!req.user) {
		res.send (401);
		return;
	}

	var transaction = new req.app.db.models.Transaction();
	transaction.name = req.params.hashtag;
	transaction.shares = req.query.shares;
	transaction.type = "sell";

	hashtag.price(req, req.params.hashtag, function(err, price) {
		transaction.price = price;
		
		req.app.db.models.Portfolio.findOne({owner: req.user._id}, function(err, portfolio){
			if(err) console.log(err);
			else {

				var previousTotal = 0;
				portfolio.totals.forEach(function(v, k){
					if(v.name == transaction.name) previousTotal = v.shares;
				});

				console.log(previousTotal);
				if(previousTotal - transaction.shares < 0) {
					res.send(402);
					return;
				}

				portfolio.balance += transaction.shares * transaction.price
				if(portfolio.balance > portfolio.maxBalance) {
					portfolio.maxBalance = portfolio.balance;
				}
				portfolio.transactions.push(transaction);
				var found = false;
				portfolio.totals.forEach(function(v, k){
					if(v.name == transaction.name){
						v.shares -= transaction.shares;
						found = true;
					}
				});
				
				if(!found) {
					portfolio.totals.push({"name": transaction.name, "shares": transaction.shares});
				}

				portfolio.save(function(err, portfolio){
					if(err) console.log(err);					
					hashtag.totalPurchased(req, transaction.name, -transaction.shares, function(err){
						if(err) res.send(500);
						res.json(portfolio);	
					})
				})
			}
		})	
	});
	

};

exports.history = function(req, res){
  res.render('index', { title: 'History | TweetStreet' });
};

exports.info = function(req, res) {
	res.json(req.user);
}


exports.home = function(req, res){
	req.app.db.models.Portfolio.findOne({owner: req.user._id}, function(err, portfolio){
		if(err) console.log(err);
		else {
			res.render('profile', { title: 'Profile | TweetStreet', portfolio: portfolio, isHome: true});
		}
	})	
};

exports.profile = function(req, res){
	req.app.db.models.Portfolio.findOne({owner: req.user._id}, function(err, portfolio){
		if(err) console.log(err);
		else {
			res.render('profile', { title: 'Profile | TweetStreet', portfolio: portfolio, isProfile: true});
		}
	})	
};
