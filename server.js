// server.js
var express      = require('express');
var cors         = require('cors');
var fs           = require('fs');
var https        = require('https');
var http         = require('http');
var app          = express();
var port         = process.env.PORT || 8080;
var sslport      = process.env.SSLPORT || 8443; 
var mongoose     = require('mongoose');
var nodemailer   = require('nodemailer');
var passport     = require('passport');
var crypto       = require('crypto');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var noCache      = require('nocache');
var path         = require('path');
var ejs          = require('ejs');
var moment       = require('moment');

var instance     = require('./config/instance');
var pkginfo      = require('pkginfo')(module, 'version', 'author');

var Employee     = require('./api/models/empModel');
var Shift        = require('./api/models/shiftModel');
var Content      = require('./api/models/contentModel');

//options for secure server
var options = {
  key: instance.options.key,//fs.readFileSync(instance.options.key),
  cert: fs.readFileSync(instance.options.cert)
};

//configuration ---------------------------------

// mongoose instance connection
mongoose.Promise = global.Promise;
mongoose.connect(instance.database, {
  useCreateIndex: true,
  useNewUrlParser: true
}); //connect to our database

require('./config/passport')(passport);

// set up our express application
app.use(noCache()); //set up no-cache

//set up CORS
var allowedOrigins = [instance.origin, instance.origin + ':' + port, instance.origin + ':' + sslport];
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(morgan('dev')); //set up logging
app.use(cookieParser()); //read cookies for auth
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs'); // set up ejs for templating

//=========================
// Static Files
//=========================
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
// required for passport
app.use(session({
    secret: instance.secret,
    resave: false,
    saveUninitialized: false
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); //persistent login sessions

// routes ----------------------------------------
var routes = require('./api/routes/routes'); //importing routes
routes(app, passport); //register the routes

//launch
https.createServer(options, app).listen(sslport);
console.log('SimpleShifts v' + module.exports.version + ' SSL server started on: ' + sslport);
