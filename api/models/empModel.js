// api/models/empModel.js
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EmployeeSchema = new Schema ({
	name: { //this is the name of the dr associated with this employee record
		type: String, 
		required: 'Please select the name of the dr'
	}
});

// Duplicate the ID field.
EmployeeSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
EmployeeSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Employees', EmployeeSchema, 'empDB'); //a collection called 'Employees' using the Employee schema