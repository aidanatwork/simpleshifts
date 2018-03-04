// api/models/content.js
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ContentSchema = new Schema({
	name: String,
	html: String
});

// Duplicate the ID field.
ContentSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
ContentSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Content', ContentSchema, 'contentDB');
