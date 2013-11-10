var util = require('util'),
    exec = require('child_process').exec;	

exports.search = function(req, res){
	console.log(req.query.q);
  price(req, req.query.q, function(err, price){
  	if(err) res.send(500);
  	res.json(price);  	
  });
  
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

exports.countExternal = countExternal = function(name, cb) {
	var child = exec(require('path').resolve(__dirname, '../bin/crawl.py') + ' ' + name,
		function (error, stdout, stderr) {
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
				else cb(null, value);
			})			
		} else {
			cache.value = parseInt(cache.value) + parseInt(value);
			cache.save(function(err, cache){
				if(err) cb(err);
				else cb(null, parseInt(cache.value));
			})	
		}
	});
}
