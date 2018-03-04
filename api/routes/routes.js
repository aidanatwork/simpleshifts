// api/routes/calRoutes.js
'use strict';
const express  = require('express'),
      mongoose = require('mongoose'),
      moment   = require('moment'),
      instance = require('../../config/instance');

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
  const shiftRoutes   = express.Router(),
        empRoutes     = express.Router(),
        contentRoutes = express.Router(),
        userRoutes    = express.Router();

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

  //=========================
  // Page Action Routes
  //=========================
  // execute logout
  app.get('/logout', calCtrl.log_out);
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
        return res.render( 'login.ejs', { title: instance.title, moment: moment,  message: info.message || 'user not found', user: false })
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.render( 'login.ejs', { title: instance.title, moment: moment, message: '', user: req.user });
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
        return res.render( 'signup.ejs', { title: instance.title, moment: moment, message: info.message || 'user already taken', user: false })
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.render( 'profile.ejs', { title: instance.title, moment: moment, content: '', message: '', success: 'success! new user created',  user: req.user });
      });
    })(req, res, next);
  });

  //=========================
  // API Routes
  //=========================

  // Set url for API group routes
  app.use('/api/shifts', shiftRoutes);
  app.use('/api/employees', empRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/user', userRoutes);

  // api healthcheck
  app.route('/api')
    .get(calCtrl.check_api);

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
};