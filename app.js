
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , http = require('http')
  , MongoStore = require('connect-mongo')(express)
  , path = require('path');


// get config
var konphyg = require('konphyg')(__dirname + '/conf/');
var config = konphyg.all();

var app = express();

//mongo uri
app.set('mongodb-uri', process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://twit:twit@ds053798.mongolab.com:53798/hackprinceton');

//setup mongoose
app.db = mongoose.createConnection(app.get('mongodb-uri'));
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  console.log('mongoose open for business');
});

// Import data models
require('./models')(app, mongoose);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({
	secret: config.db.sessionSecret,
	maxAge: new Date(Date.now() + 3600000),
	store: new MongoStore(config.db)
}));
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.methodOverride());
app.use(function(req, res, next){
  if(req.user){
    res.locals.user = req.user;
  }   
  next()
})
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Import utilities and configure uri routing
require('./utilities')(app);
require('./lib/passport')(app, passport);
require('./routes')(app, passport);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
