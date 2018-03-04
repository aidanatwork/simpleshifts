'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Employee = require('./empModel');

var ShiftSchema = new Schema({
	employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employees'},
	shiftType: {
		type: String,
		enum: ['UC','Call','Vacation'],
		default: 'UC'
	}, 
	start: Date
});

ShiftSchema.virtual('id').get(function(){
    return this._id.toHexString();
});
ShiftSchema.virtual('end').get(function(){
	return this.start;
});

// Ensure virtual fields are serialised.
ShiftSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Shifts', ShiftSchema, 'shiftDB');