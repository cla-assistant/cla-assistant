const mongoose = require('mongoose')
const utils = require('./utils')
// const logger = require('../services/logger')

const RepoSchema = mongoose.Schema({
    repoId: String,
    repo: String,
    owner: String,
    gist: String,
    token: String,
    sharedGist: Boolean,
    minFileChanges: Number,
    minCodeChanges: Number,
    whiteListPattern: String,
    privacyPolicy: String,
    updated_at: Date
})

const index = {
    repoId: 1,
    repo: 1,
    owner: 1
}
const indexOptions = {
    unique: true
}

RepoSchema.methods.isUserWhitelisted = function (user) {
    return utils.checkPatternWildcard(this.whiteListPattern, user)
}

const Repo = mongoose.model('Repo', RepoSchema)

// Repo.collection.dropAllIndexes(function (err, results) {
//     if (err) {
//         logger.warn('Repo collection dropAllIndexes error: ', err)
//         logger.warn('dropAllIndexes results: ', results)
//     }
// })

Repo.collection.createIndex(index, indexOptions)

module.exports = {
    Repo: Repo
}