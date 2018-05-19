// api/models/historyModel.js
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HistorySchema = new Schema({
    user: String, //the user that performed this action
    shift: String, //shiftID for the history action
    actionType: {
        type: String,
        enum: ['created','deleted']
    },
    updatedAt: Date
});

HistorySchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
HistorySchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('History', HistorySchema, 'historyDB');