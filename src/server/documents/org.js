let mongoose = require('mongoose');
let utils = require('./utils');
mongoose.Promise = require('q').Promise;

let OrgSchema = mongoose.Schema({
    orgId: String,
    org: String,
    gist: String,
    token: String,
    excludePattern: String,
    sharedGist: Boolean,
    minFileChanges: Number,
    minCodeChanges: Number,
    whiteListPattern: String,
});

OrgSchema.methods.isRepoExcluded = function (repo) {
    return utils.checkPattern(this.excludePattern, repo);
};

OrgSchema.methods.isUserWhitelisted = function (user) {
    return utils.checkPatternWildcard(this.whiteListPattern, user);
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
