let mongoose = require('mongoose');
let utils = require('./utils');
// let logger = require('../services/logger');
mongoose.Promise = require('q').Promise;

let RepoSchema = mongoose.Schema({
    repoId: String,
    repo: String,
    owner: String,
    gist: String,
    token: String,
    sharedGist: Boolean,
    minFileChanges: Number,
    minCodeChanges: Number,
    whiteListPattern: String
});

let index = {
    repoId: 1,
    repo: 1,
    owner: 1
};
let indexOptions = {
    unique: true
};

RepoSchema.methods.isUserWhitelisted = function (user) {
    return utils.checkPatternWildcard(this.whiteListPattern, user);
};

let Repo = mongoose.model('Repo', RepoSchema);

// Repo.collection.dropAllIndexes(function (err, results) {
//     if (err) {
//         logger.warn('Repo collection dropAllIndexes error: ', err);
//         logger.warn('dropAllIndexes results: ', results);
//     }
// });

Repo.collection.createIndex(index, indexOptions);

module.exports = {
    Repo: Repo
};