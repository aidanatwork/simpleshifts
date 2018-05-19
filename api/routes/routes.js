// api/routes/calRoutes.js
'use strict';
const async      = require('async'),
      crypto     = require('crypto'),
      express    = require('express'),
      instance   = require('../../config/instance'),
      moment     = require('moment'),
      mongoose   = require('mongoose'),
      nodemailer = require('nodemailer'),
      Content    = mongoose.model('Content'),
      User       = mongoose.model('User');

//utility functions
const isLoggedIn = function(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();
    // if they aren't, redirect them to the home page
    res.redirect('/');
};

module.exports = function(app, passport) {
  const calCtrl = require('../controllers/controller');
    // Initializing route groups
  const shiftRoutes     = express.Router(),
        shiftHistRoutes = express.Router(),
        empRoutes       = express.Router(),
        contentRoutes   = express.Router(),
        userRoutes      = express.Router(),
        changesRoutes   = express.Router();

  //=========================
  // Page Routes
  //=========================
  //show home page
  app.get('/', calCtrl.get_index);
  //show login page
  app.get('/login', calCtrl.get_login);
  //show signup page
  app.get('/signup', calCtrl.get_signup);
  //show profile page
  app.get('/profile', isLoggedIn, calCtrl.get_profile);
  //show forgot password page
  app.get('/forgot', function(req,res){
      res.render('forgot.ejs', {
          title: instance.title, moment: moment, message: '', success:'', user: req.user
      });
  });
  //show reset password page
  app.get('/reset/:token', function(req, res) {
    User.findOne({
        'local.resetPasswordToken' : req.params.token,
        'local.resetPasswordExpires' : { $gt: Date.now() }
    }, function(err, user){
      if (err) {
          console.log('Err on reset:token GET: ' + err);
      }
      if (!user) {
        console.log('Tried reset but user not found');
        res.render('reset.ejs', {
            title: instance.title,
            moment: moment,
            message: 'Password reset token is invalid or has expired. Contact your SimpleShifts administrator for assistance.',
            success: '',
            token:'',
            user: false
        });
      } else {
        console.log('Token is valid');
        res.render('reset.ejs', {
            title: instance.title,
            moment: moment,
            message: '',
            success: 'Token is valid. Go ahead and retrieve',
            token:req.params.token,
            user: req.user
        });
      }
    });
  });
  //show page with latest changes to shift data
  app.get('/changes', isLoggedIn, calCtrl.get_changes);

  //=========================
  // Page Action Routes
  //=========================
  // execute logout
  app.get('/logout', calCtrl.log_out);
  //process forgot password request
  app.post('/forgot', function(req,res, next){
    console.log('Start processing of POST for reset email');
    async.waterfall([
        //generate token for the reset
        function(done) {
          console.log('1 - generating token...');
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        //search for the entered user
        function (token, done) {
          console.log('2 - searching for user...');
          User.findOne({ 'local.email': req.body.email }, function(err, user) {
            if (!user) {
              res.render('/forgot', {
                title: instance.title, moment: moment, message: 'User not found', success:'', user: false
              });
            }
            user.local.resetPasswordToken = token;
            user.local.resetPasswordExpires = Date.now() + 3600000 //expires in 1 hour

            user.save(function (err) {
              done(err, token, user);
            });

          });
        },
        //send the reset email
        function(token, user, done) {
          console.log('3 - sending the reset email...');
          var smtpTransport = nodemailer.createTransport({
            service: instance.emailservice.service,
            auth: {
              user: instance.emailservice.user,
              pass: instance.emailservice.pass
            },
            logger: true
          });
          var mailOptions = {
            to: user.local.email,
            from: instance.emailservice.fromname,
            subject: 'SimpleShifts Password Reset',
            text: 'Please click on the following link, or paste it into your browser, to reset your password:\n\n' +
            'https://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this reset, please ignore this email and your password will remain unchanged.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err, info){
            if (err) {
              console.log('Error in sendMail: ' + err.message);
              res.render('forgot.ejs', {
                  title: instance.title, moment: moment, message:'Failed to create reset link', success: '', user: false
              });
            }
            console.log('Msg sent successfully');
            res.render('forgot.ejs', {
              title: instance.title, moment: moment, message:'', success: 'An email has been sent to ' + user.local.email +
                ' with further instructions.', user: false
            });
          });
        }
    ], function (err){
      if (err) {
        return next(err);
      }
      console.log('Error sending password reset link: ' + err);
      res.render('forgot.ejs', {
        title: instance.title, moment: moment, message:'', success:'', user:false
      });
    });
  });
  //process the password reset form
  app.post('/reset/:token', function(req,res){
    async.waterfall([
      function(done) {
        User.findOne({
          'local.resetPasswordToken' : req.params.token,
          'local.resetPasswordExpires' : {$gt: Date.now()}
        }, function (err, user) {
          if (!user) {
              console.log('Trying to POST to reset/:token but user not found');
              res.render('reset.ejs', {
                  title: instance.title,
                  moment: moment,
                  message: 'Password reset token is invalid or has expired',
                  success: '',
                  token:req.params.token,
                  user: false
              });
          }
          user.local.password = user.generateHash(req.body.password);
          user.local.resetPasswordToken = undefined;
          user.local.resetPasswordExpires = undefined;

          user.save(function (err) {
            if (err) {
                console.log('err on reset save: ' + err);
            }
            req.logIn(user, function(err){
              done(err, user);
            });
          });
        });
      },
      function(user, done){
        var smtpTransport = nodemailer.createTransport({
            service: instance.emailservice.service,
            auth: {
                user: instance.emailservice.user,
                pass: instance.emailservice.pass
            },
            logger: true
        });
        var mailOptions = {
            to: user.local.email,
            from: instance.emailservice.fromname,
            subject: 'SimpleShifts Password Reset',
            text: 'This is a confirmation that the password for your account ' + user.local.email + ' has just been changed.\n' +
                  'If you did not request this change, please contact your SimpleShifts administrator.'
        };
        smtpTransport.sendMail(mailOptions, function(err, info){
            if (err) {
                console.log('Error in sendMail: ' + err.message);
                res.render('reset.ejs', {
                    title: instance.title, moment: moment, message:'Failed to reset password', success: 'An email has been sent to ' + user.local.email +
                    ' with further instructions.', user: false
                });
            }
            console.log('Msg sent successfully');
            Content.findOne({ name: 'hp' }, function(err, field) {
                if (err) {
                    console.log('Error retrieving content: ' + err);
                    res.render('index.ejs', { title: instance.title, moment: moment, message: '', success:'', content: '', user: req.user});
                } else {
                    field.html = unescape(field.html);
                    res.render('index.ejs', { title: instance.title, moment: moment, message: '', success:'Success! Your password has been changed.', content: field, user: req.user});
                }
            });
        });
      }
    ], function(err){
      res.render('forgot.ejs', {
          title: instance.title,
          moment: moment,
          message:'There was a problem resetting your password.' +
                  'Please contact your SimpleShifts administrator.',
          success:'',
          user:false
      });
    });
  });
  // process the login form
  // TODO - figure out how to externalize this to controller.js, without losing access to passport
  app.post('/login', function(req,res,next){
    passport.authenticate('local-login', {
      badRequestMessage: 'all fields are required'
    }, function(err, user, info) {
      if (err) { 
        return next(err); 
      }
      if (!user) { 
        return res.render( 'login.ejs', {
          title: instance.title, moment: moment,  message: info.message || 'user not found', user: false
        })
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.render( 'login.ejs', {
          title: instance.title, moment: moment, message: '', user: req.user
        });
      });
    })(req, res, next);
  });
  // process the signup form
  // TODO - figure out how to externalize this to controller.js, without losing access to passport
  app.post('/signup', function(req,res,next){
    passport.authenticate('local-signup', {
      badRequestMessage: 'all fields are required'
    }, function(err, user, info) {
      if (err) { 
        return next(err); 
      }
      if (!user) {
        console.log('signup user not found');
        return res.render( 'signup.ejs', {
          title: instance.title, moment: moment, message: info.message || 'user already taken', user: false
        })
      }
      req.logIn(user, function(err) {
        console.log('signup logging in');
        if (err) { return next(err); }
        return res.render( 'profile.ejs', {
          title: instance.title, moment: moment, content: '', message: '', success: 'success! new user created',  user: req.user
        });
      });
    })(req, res, next);
  });

  //=========================
  // API Routes
  //=========================

  // Set url for API group routes
  app.use('/api/shifts', shiftRoutes);
  app.use('/api/shiftHist', shiftHistRoutes);
  app.use('/api/employees', empRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/changes', changesRoutes);

  // api healthcheck
  app.route('/api')
    .get(calCtrl.check_api);

  //changes api routes
    changesRoutes.get('/', isLoggedIn, calCtrl.list_all_changes);

  //user api routes
  userRoutes.post('/', isLoggedIn, calCtrl.update_a_user);

  //shift api routes
  shiftRoutes.route('/multi')
    .post(calCtrl.update_multi_shifts);

  shiftRoutes.route('/:shiftId')
    .get(calCtrl.read_a_shift)
    .put(calCtrl.update_a_shift)
    .delete(calCtrl.delete_a_shift);

  shiftRoutes.route('/')
  .get(calCtrl.list_all_shifts)
  .post(calCtrl.create_a_shift);

  //shift history api routes
  shiftHistRoutes.route('/')
  .get(calCtrl.read_history_for_shifts);
  //employee api routes
  empRoutes.route('/')
    .get(calCtrl.list_all_emps)
    .post(calCtrl.create_an_emp);

  empRoutes.route('/:empId')
    .get(calCtrl.read_an_emp)
    .put(calCtrl.update_an_emp)
    .delete(calCtrl.delete_an_emp);    

  //content api routes
  contentRoutes.route('/:fieldName')
  .get(calCtrl.read_a_content_field)
  .put(calCtrl.update_a_content_field);

  contentRoutes.route('/')
    .get(calCtrl.list_all_content_fields)
    .post(calCtrl.create_a_content_field);

  contentRoutes.route('/:fieldName/histories')
      .get(calCtrl.read_history_for_content_field);
};