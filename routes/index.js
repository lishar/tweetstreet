
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('help', { title: 'Home | TweetSt' });
};

exports.about = function(req, res){
	res.render('about', { title: 'About | TweetSt' });
};