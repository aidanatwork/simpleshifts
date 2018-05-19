// api/models/userModel.js
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt   = require('bcrypt');

var UserSchema = new Schema({
	local : {
		email	 : { type: String, required: true, unique: true },
		password : { type: String, required: true },
        resetPasswordToken: String,
        resetPasswordExpires: Date
	}
});

//methods ==================
//generating a hash
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

UserSchema.virtual('id').get(function(){
    return this._id.toHexString();
});
// Ensure virtual fields are serialised.
UserSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('User', UserSchema, 'userDB');