const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a registered user in the system.
 */
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
});

module.exports = mongoose.model('User', UserSchema);
