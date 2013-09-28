exports = module.exports = function(app, mongoose) {

	var consumerSchema = new mongoose.Schema({		
		id: {type: String, index: {unique: true}},		
		name: String,	
		consumerKey: String,
		consumerSecret: String,
		comments: {type: String, default: ""}
	});
	  
	app.db.model('AuthConsumer', consumerSchema);
}


