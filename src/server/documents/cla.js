var mongoose = require('mongoose');

var CLASchema = mongoose.Schema({
    repo: String,
    owner: String,
    user: String,
    gist_url: String,
    gist_version: String,
    created_at: Date,
    revoked: {type: Boolean, default: false },
    revoked_at: Date
});

CLASchema.index({
    repo: 1,
    owner: 1,
    user: 1,
    gist_url: 1,
    gist_version: 1
}, {
    unique: true
});

var CLA = mongoose.model('CLA', CLASchema);

module.exports = {
    CLA: CLA
};
