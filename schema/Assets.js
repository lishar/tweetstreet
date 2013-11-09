exports = module.exports = function(app, mongoose) {

	var transactionSchema = new mongoose.Schema({			
			name: String,
			shares: Number,
			price: Number,		
			type: String,		
			created: {type: Date, default: Date.now}
		});

	var portfolioSchema = new mongoose.Schema({		
		owner: String,		
		transactions: [transactionSchema],
		totals: [{name: String, shares: Number}],
		created: {type: Date, default: Date.now}
	});
	 
	app.db.model('Transaction', transactionSchema);
	app.db.model('Portfolio', portfolioSchema);
}


