exports = module.exports = function(app, passport) {

	var user = require('./routes/user');

	//front end
	app.get('/', require('./routes/index').index);

	// Authentication
	app.get('/register', user.register);
	app.post('/register', user.registerPost);
	app.get('/login', user.login);
	app.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' }));

	app.get('/logout', user.logout);

	app.post('/oauth/request_token', require('./routes/user').request_token);
	app.post('/oauth/access_token', require('./routes/user').access_token);

	// // API
	app.get('/api/userinfo', user.info);

	//route not found
	// app.all('*', require('./views/http/index').http404);
}