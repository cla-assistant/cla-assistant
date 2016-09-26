var mongoose = require('mongoose');

var OrgSchema = mongoose.Schema({
    orgId: String,
    org: String,
    gist: String,
    token: String,
    excludePattern: String,
});

OrgSchema.methods.isRepoExcluded = function (repo) {
    if (!this.excludePattern || !repo || !repo.includes) {
        return false;
    }
    var patterns = this.excludePattern.split(',');
    return patterns.filter(function(pattern) { return repo.includes(pattern); }).length > 0;
};

OrgSchema.index({
    orgId: 1,
}, {
    unique: true
});

var Org = mongoose.model('Org', OrgSchema);

module.exports = {
    Org: Org
};
