exports = module.exports = function(app, mongoose) {

	var requestTokenSchema = new mongoose.Schema({		
		secret: String,
		clientID: String,	
		callbackURL: String,
		created: {type: Date, default: Date.now}
	});

	var accessTokenSchema = new mongoose.Schema({		
		secret: String,
		clientID: String,	
		userID: String,
		created: {type: Date, default: Date.now}
	});
	  
	app.db.model('AuthRequestToken', requestTokenSchema);
	app.db.model('AuthAccessToken', accessTokenSchema);
}


