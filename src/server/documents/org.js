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
    whiteListPattern: String,
    privacyPolicy: String,
    updated_at: Date
})

OrgSchema.methods.isRepoExcluded = (repo) => utils.checkPattern(this.excludePattern, repo)

OrgSchema.methods.isUserWhitelisted = (user) => utils.checkPatternWildcard(this.whiteListPattern, user)

OrgSchema.index({
    orgId: 1,
}, {
        unique: true
    })

const Org = mongoose.model('Org', OrgSchema)

module.exports = {
    Org: Org
}
