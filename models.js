exports = module.exports = function(app, mongoose) {
	//general sub docs
	require('./schema/User')(app, mongoose);	
	
}