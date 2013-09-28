exports = module.exports = function(app, mongoose) {

	var userSchema = new mongoose.Schema({		
		email: {type: String, index: {unique: true}},		
		name: String,	
		password: String,
		status: { type: String, default: 'pending' },
		created: {type: Date, default: Date.now}
	});
	  
	app.db.model('User', userSchema);
}


