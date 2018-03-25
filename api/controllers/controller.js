'use strict';

var mongoose = require('mongoose'),
    async    = require('async'),
    Shift    = mongoose.model('Shifts'),
    Employee = mongoose.model('Employees'),
    Content  = mongoose.model('Content'),
    User     = mongoose.model('User'),
    moment   = require('moment'),
    instance = require('../../config/instance'),
    pkginfo  = require('pkginfo')(module, 'version', 'author');

//utility functions
var trimIncomingShift = function(trimmedShift) {
  if (trimmedShift.className) {
    delete trimmedShift.className;
  };
  if (trimmedShift.title) {
    delete trimmedShift.title;
  };
  return trimmedShift
};
var processShiftToSend = function(shift, name) {  
  var newShift = {};
  newShift.__v = shift.__v;
  newShift.id = shift.id;
  newShift._id = shift._id;
  newShift.employee = shift.employee;
  newShift.title = name || 'no title';
  newShift.shiftType = shift.shiftType;
  newShift.start = shift.start;
  newShift.end = shift.end;
  newShift.className = [newShift.title.toLowerCase().replace(/ /g,'-'), newShift.shiftType];
  return newShift; 
};
//API health check
exports.check_api = function(req, res) {
  res.send('The API is running. SimpleShifts version ' + module.exports.version + '.');
};
//serving site pages
exports.get_index = function(req, res) {
/* TO DO - figure out if history is being saved and how to access it
    var history = Content.historyModel();
    console.log('Content model history: '  + Content.historyModel());
    var collection = history.db.collections.contentDB_history.collection;
    for (var key in collection) {
      console.log('collection[' + key + ']: ' + collection[key]);
    }
*/
    Content.findOne({ name: 'hp' }, function(err, field) {
    if (err) {
      console.log('Error retrieving content: ' + err);
      res.render('index.ejs', { title: instance.title, moment: moment, message: '', content: '', user: req.user});
    } else {
      field.html = unescape(field.html);
      res.render('index.ejs', { title: instance.title, moment: moment, message: '', content: field, user: req.user});
    }
  });
};
exports.get_login = function(req, res) {
  res.render( 'login.ejs', { title: instance.title, moment: moment,  message: '',  user: req.user });
};
exports.get_signup = function(req, res) {
// render the page and pass in any msg if it exists
  res.render( 'signup.ejs', { title: instance.title, moment: moment, message: '',  user: (req.user || false) });
};
exports.get_profile = function(req, res) {
  Content.findOne({ name: 'hp' }, function(err, field) {
    if (err) {
      console.log('Error retrieving content: ' + err);
      res.render('profile.ejs', { title: instance.title, moment: moment, message: '', success: '', content: '', user: req.user});
    } else {
      field.html = unescape(field.html);
      res.render('profile.ejs', { title: instance.title, moment: moment, message: '', success: '', content: field, user: req.user});
    }
  });
};
//processing page actions
exports.log_out = function(req, res) {
  req.logout();
  res.redirect('/');
};

//CRUD operations for employee table
exports.list_all_emps = function(req, res) {
  Employee.find({}, function(err, emp) {
    if (err) {
      res.send(err);
    } else {
      res.status(200).json(emp);      
    }
  });
};
exports.create_an_emp = function(req, res) {
  var new_emp = new Employee(req.body);
  new_emp.save(function(err, emp) {
    if (err) 
      res.send(err);
    res.status(201).json(emp);
  });
};
exports.read_an_emp = function(req, res) {
  Employee.findById(req.params.empId,
    function(err, emp) {
    if (err) {
      res.send(err);
    } else {
      res.status(200).json(emp);
    }
  });
};
exports.update_an_emp = function(req, res) {
  var updateEmpId = req.params.empId;
  var updateName = req.body.name;
  Employee.findOneAndUpdate({_id: req.params.empId}, req.body, {new: true}, function(err, emp) {
    if (err) {
      res.send(err);
    } else {
      res.status(200).json(emp);
    };
  });
};
//TODO - fix this one so that shift IDs populate
exports.delete_an_emp = function(req, res) {
  Shift.deleteMany({ employee: req.params.empId  }, function (err, shiftSet) {
    if (err) {
      console.log(err);
    } else {
      Employee.remove({ _id:req.params.empId }, function(err) {
        if (err) {
          res.send(err)
        } else {
          res.status(202).json({ message: 'Emp successfully deleted. ' });
        } 
      });
    }
  });  
};

//CRUD operations for shift table
exports.list_all_shifts = function(req, res) {
  Shift.find().
  populate('employee').
  exec(function(err, shiftSet){
    var returnObj = [];
    for (var i = 0; i < shiftSet.length; i++) {
      var newShift = processShiftToSend(shiftSet[i], shiftSet[i].employee.name);
      returnObj.push(newShift);
      if ( i === (shiftSet.length-1) ) {
        if (err) {
          res.send(err);
        } else {
          res.status(200).json(returnObj);
        }
      }
    }
  });
};
exports.create_a_shift = function(req, res) {
  var trimmedShift = trimIncomingShift(req.body);
  var new_shift = new Shift(trimmedShift);
  new_shift.save(function(err, shift) {
    if (err) {
      res.send(err);
    } else {
      res.status(201).json(shift);      
    }
  });
};
exports.read_a_shift = function(req, res) {
  Shift.findOne({ _id: req.params.shiftId }).
  populate('employee').
  exec(function (err, shift) {
    if (err) {res.send(err)};
    var newShift = processShiftToSend(shift, shift.employee.name);
    res.status(200).json(newShift);
  });
};
exports.update_a_shift = function(req, res) {
  var new_shift = req.body;
  delete new_shift.className;
  delete new_shift.title;
  Shift.findOneAndUpdate({_id: req.params.shiftId}, new_shift, {new: true}, function(err, shift) {
    if (err) {
      res.send(err);
    } else {
      res.status(200).json(shift);
    }
  });
};
exports.update_multi_shifts = function(req, res) {
  async.eachSeries(req.body, 
    function(obj, done) {
      var newObj = trimIncomingShift(obj);
      Shift.findOneAndUpdate(
        { _id: newObj.id },
        newObj,
        { new: true},
        function(err) {
          if (err) {
            res.send(err);
          }
        }
      );
      done();
    }, 
    function (err) {
      if (err) {
        console.log(err); 
        res.send(err);     
      } else {
        res.status(200).send('multi update completed');
      }
    }
  );
};
exports.delete_a_shift = function(req, res) {
  Shift.remove({
    _id: req.params.shiftId
  }, function(err, shift) {
    if (err) {
      res.send(err);
    } else {
      res.status(202).json({ message: 'Shift successfully deleted' });
    }
  });
};

//CRUD operations for content table
exports.create_a_content_field = function (req, res) {
  var new_field = new Content(req.body);
  new_field.save(function(err, field) {
    if (err) {
      res.send(err);  
    }
    res.status(201).json(field);
  });
};
exports.list_all_content_fields = function(req, res) {
  Content.find({}, function(err, field) {
    if (err) {
      res.send(err);
    } else {
      res.status(200).json(field);      
    }
  });
};
exports.read_a_content_field = function(req, res) {
  Content.findOne({ name: req.params.fieldName },
    function(err, field) {
    if (err) {
      res.send(err);
    } else {
      res.status(200).json(field);
    }
  });
};
exports.update_a_content_field = function(req, res) {
  var new_field = req.body;
  Content.findOneAndUpdate({name: req.params.fieldName}, new_field, {new: true}, function(err, field) {
    if (err) {
      res.send(err);
    } else {
      //res.status(200).json(field);
      res.render( 'profile.ejs', { title: instance.title, moment: moment, message: '', content: field, success: 'success! content updated',  user: req.user })
    }
  });  
};

//CRUD operations for user table
exports.update_a_user = function(req,res){
  User.findById(req.user.id,function(err, user) {
    if (err) {
      console.log(err);
    }
    if(!user){
      res.status(500).send({error:'user not found'});
    }
    var updateField = '';
    if (req.body.updateType === 'email') {
      //email update
      updateField = 'email';
      //process payload
      var email = req.body.local.email.trim();
      //validate
      if (!email) {
        res.status(400).send({error:'no email in request'});   
      }
      //TODO - add check to make sure new email isn't already being used for another user
      user.local.email = email;
    }
    if (req.body.updateType === 'pwd') {
       //password update
      updateField = 'password';
      var pwd = req.body.local.password.trim();
      //validate
      if (!pwd) {
        res.status(400).send({error:'no pwd in request'});    
      }
      user.local.password = user.generateHash(pwd);
    }
    user.save(function (err) {
      if (err) {
        console.log('error saving user: ' + err);
        res.status(500).send({error:'error saving new user'});
      }
      res.status(200).send('Credential update success!');
    });
  });
};