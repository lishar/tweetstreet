var util = require('util'),
	sugar = require('sugar'),
    exec = require('child_process').exec;	

exports.stock = function(req, res){
	console.log(req.query.q);
	req.app.db.models.Portfolio.findOne({owner: req.user._id}, function(err, portfolio){
		if(err) console.log(err);
		else {
			req.app.db.models.Cache.findOne({name: req.query.q + '#total'}, function(err, cache){
				if(err) console.log(err);
				else {
					price(req, req.query.q, function(err, price){
					  	if(err) res.send(500);
					  	trend(req, req.query.q, function(err, trendResult){
						  	if(err) res.send(500);
						  	// res.write(price);
						  	// res.json(trend);  
						  	var search = {
						  		q: req.query.q,
						  		price: price,
						  		trend: [],
						  		change: 0
						  	}	

						  	var td = [];
						  	for(var i = 0; i < trendResult.length; i++){
						  		var d = Date.create().addDays(-i).format("{Dow} {dd}");
						  		td.push([d, trendResult[i]])
						  	}
						  	search.trend = td.reverse();

						  	req.app.db.models.Cache.findOne({name: req.query.q + '#pastTotal'}, function(err, pastCache){
						  		if(err) res.send(500);
						  		var pastInflation = parseInt(search.trend[search.trend.length-2][1]) * (1 + (0.005 * parseInt(pastCache.value)));
								var pastPrice = ((parseInt(search.trend[search.trend.length-2][1]) + pastInflation)/2)/100;
						  		search.change = (price - pastPrice)/price;

						  		search.total = 0;
						 	 	search.totalLifetime = 0;
						  		if(cache) search.totalLifetime = cache.value;

						  	portfolio.totals.forEach(function(v){
						  		if(v.name == req.query.q) search.total = v.shares;
						  	})
						  	res.render('stock', { title: 'Search | TweetSt', search: search });
						});
					  });
					});
				}
			})	
			
		}
	})
};

exports.price = price = function(req, name, cb) {
	count(req, name, function(err, count){
		if(err) res.send(500);
		var price = count;
		totalPurchased(req, name, function(err, totalPurchased){
			if(err) res.send(500);
			var inflation = price * (1 + (0.005 * totalPurchased));			
			price = ((price + inflation)/2)/100;
			cb(null, price);	
		})					
	});
}

exports.count = count = function(req, name, cb) {	
	req.app.db.models.Cache.findOne({name: name}, function(err, cache){
		if(err) console.log(err);
		if(!cache) {			
			var cache = new req.app.db.models.Cache();
			cache.name = name;
			countExternal(name, function(err, count) {
				if(err) cb(err);				
				cache.value = count;
				cache.save(function(err){
					if(err) cb(err);
					else cb(null, parseInt(count));
				})
			})
		} else {			
			var last = new Date(cache.lastUpdated);			
			var now = new Date();
			
			if((now.getTime() - last.getTime())/1000 > 900){				
				countExternal(name, function(err, count) {
					if(err) cb(err);
					cache.value = count;
					cache.save(function(err){
						if(err) cb(err);
						else cb(null, parseInt(count));
					})
				})
			} else {
				cb(null, parseInt(cache.value));	
			}			
		}
	});
}


exports.trend = trend = function(req, n, cb) {		
	name = n + '#trend';
	req.app.db.models.Cache.findOne({name: name}, function(err, cache){
		if(err) console.log(err);
		if(!cache) {			
			var cache = new req.app.db.models.Cache();
			cache.name = name;
			historicExternal(n, function(err, trend) {
				if(err) cb(err);				
				cache.value = trend;
				cache.save(function(err){
					if(err) cb(err);
					else cb(null, JSON.parse(trend));
				})
			})
		} else {			
			var last = new Date(cache.lastUpdated);			
			var now = new Date();
			
			if((now.getTime() - last.getTime())/1000 > 86400){				
				historicExternal(n, function(err, trend) {
					if(err) cb(err);
					cache.value = trend;
					cache.save(function(err){
						if(err) cb(err);
						else cb(null, JSON.parse(trend));
					})
				})
			} else {
				cb(null, JSON.parse(cache.value));	
			}			
		}
	});
}
exports.countExternal = countExternal = function(name, cb) {
	var child = exec(require('path').resolve(__dirname, '../bin/crawl.py') + ' ' + name,
		function (error, stdout, stderr) {
			cb(error, stdout.trim());
		});
}

exports.historicExternal = historicExternal = function(name, cb) {
	console.log('n: '+ name)
	var child = exec(require('path').resolve(__dirname, '../bin/monthcrawler.py') + ' ' + name,
		function (error, stdout, stderr) {
			console.log("SO:" + stdout);
			cb(error, stdout.trim());
		});
}

exports.totalPurchased = totalPurchased = function(req, name, value, cb) {
	if(typeof(value) == "function") { cb = value; value = 0; }
	req.app.db.models.Cache.findOne({name: name + '#total'}, function(err, cache){
		if(err) console.log(err);
		if(!cache) {
			var cache = new req.app.db.models.Cache();
			cache.name = name + '#total';				
			cache.value = value;
			cache.save(function(err){
				if(err) cb(err);
			})
			var pastCache = new req.app.db.models.Cache();
			pastCache.name = name + '#pastTotal';				
			pastCache.value = 0;
			pastCache.save(function(err){
				if(err) cb(err);
				else cb(null, value);
			})
		} else {
			var last = new Date(cache.lastUpdated);
			var today = new Date();
			today.setUTCHours(0,0,0,0);
			if(last < today) {
				req.app.db.models.Cache.findOne({name: name + '#pastTotal'}, function(err, pastCache){
					pastCache.value = cache.value;
					pastCache.save(function(err){
						if(err) cb(err);
					})
					cache.value = parseInt(cache.value) + parseInt(value);
					cache.save(function(err, cache){
						if(err) cb(err);
						else cb(null, parseInt(cache.value));
					})
				});
			} else {
				cache.value = parseInt(cache.value) + parseInt(value);
				cache.save(function(err, cache){
					if(err) cb(err);
					else cb(null, parseInt(cache.value));
				})
			}
		}
	});
}
