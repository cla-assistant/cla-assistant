let mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;

let OrgSchema = mongoose.Schema({
    orgId: String,
    org: String,
    gist: String,
    token: String,
    excludePattern: String,
    sharedGist: Boolean,
    minFileChanges: Number,
    minCodeChanges: Number
});

OrgSchema.methods.isRepoExcluded = function (repo) {
    if (!this.excludePattern || !repo || !repo.includes) {
        return false;
    }
    let patterns = this.excludePattern.split(',');

    return patterns.filter(function (pattern) { return repo.includes(pattern); }).length > 0;
};

OrgSchema.index({
    orgId: 1,
}, {
        unique: true
    });

let Org = mongoose.model('Org', OrgSchema);

module.exports = {
    Org: Org
};
