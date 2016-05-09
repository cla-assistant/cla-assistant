var mongoose = require('mongoose');

var OrgSchema = mongoose.Schema({
    orgId: String,
    org: String,
    gist: String,
    token: String
});

OrgSchema.index({
    orgId: 1,
}, {
    unique: true
});

var Org = mongoose.model('Org', OrgSchema);

module.exports = {
    Org: Org
};
