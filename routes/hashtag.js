var util = require('util'),
    exec = require('child_process').exec;	

exports.search = function(req, res){
  price(req, req.params.hashtag, function(err, count){
  	if(err) res.send(500);
  	res.send(count);
  });
  
};

exports.price = price = function(req, name, cb) {
	req.app.db.models.Cache.findOne({name: name}, function(err, cache){
		if(err) console.log(err);
		if(!cache) {
			var cache = new req.app.db.models.Cache();
			cache.name = name;
			priceExternal(name, function(err, count) {
				if(err) cb(err);				
				cache.value = count;
				cache.save(function(err){
					if(err) cb(err);
					else cb(null, count);
				})
			})
		} else {			
			var last = new Date(cache.lastUpdated);			
			var now = new Date();
			
			if((now.getTime() - last.getTime())/1000 > 900){				
				priceExternal(name, function(err, count) {
					if(err) cb(err);
					cache.value = count;
					cache.save(function(err){
						if(err) cb(err);
						else cb(null, count);
					})
				})
			} else {
				cb(null, cache.value);	
			}			
		}
	});
}

exports.priceExternal = priceExternal = function(name, cb) {
	var child = exec(require('path').resolve(__dirname, '../bin/crawl.py') + ' ' + name,
		function (error, stdout, stderr) {
			cb(error, stdout.trim());
		});
}