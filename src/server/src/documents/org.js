const mongoose = require('mongoose')
const utils = require('./utils')

const OrgSchema = mongoose.Schema({
    orgId: String,
    org: String,
    gist: String,
    token: String,
    excludePattern: String,
    sharedGist: Boolean,
    minFileChanges: Number,
    minCodeChanges: Number,
    allowListPattern: String,
    allowListPatternOrgs: String,
    privacyPolicy: String,
    updated_at: Date
})

OrgSchema.methods.isRepoExcluded = function (repo) {
    return utils.checkPattern(this.excludePattern, repo)
}

OrgSchema.methods.isUserOnAllowlist = function (user) {
    return utils.checkPatternWildcard(this.allowListPattern, user)
}

OrgSchema.methods.isOrgOnAllowlist = function (org) {
    return utils.checkPatternWildcard(this.allowListPatternOrgs, org)
}

OrgSchema.index({
    orgId: 1,
}, {
        unique: true
    })

const Org = mongoose.model('Org', OrgSchema)

module.exports = {
    Org: Org
}
