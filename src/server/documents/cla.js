var mongoose = require('mongoose');

var CLASchema = mongoose.Schema({
    uuid: Number,
    repo: String,
    user: Number,
    href: String,
    created_at: Date
});

CLASchema.index({
    repo: 1,
    user: 1,
    href: 1
}, {
    unique: true
});

var CLA = mongoose.model('CLA', CLASchema);

module.exports = {
    CLA: CLA
};
