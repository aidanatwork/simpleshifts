// api/models/shiftModel.js
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ShiftSchema = new Schema({
	employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employees'},
	shiftType: {
		type: String,
		enum: ['UC','Call','Vacation'],
		default: 'UC'
	},
	start: Date,
    dayOrNight: {
        type: String,
        enum: ['day','night','unset'],
        default: 'unset'
    }/*,
	createdBy: String,
	createdAt: Date*/
});

var diffHistory = require("mongoose-diff-history/diffHistory").plugin;
ShiftSchema.plugin(diffHistory, { omit: ['end'] });

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