exports = module.exports = function(app, mongoose) {
	//general sub docs
	require('./schema/User')(app, mongoose);
	require('./schema/Consumers')(app, mongoose);
	require('./schema/Tokens')(app, mongoose);
}