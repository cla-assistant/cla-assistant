var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
    uuid: Number,
    requests: Array,
    token: String
});

var User = mongoose.model('User', UserSchema);

module.exports = {
    User: User
};
