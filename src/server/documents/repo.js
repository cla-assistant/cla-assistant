var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;

var RepoSchema = mongoose.Schema({
    repoId: String,
    repo: String,
    owner: String,
    gist: String,
    token: String,
    sharedGist: Boolean
});

var index = {
    repoId: 1,
    repo: 1,
    owner: 1
};
var indexOptions = {
    unique: true
};

var Repo = mongoose.model('Repo', RepoSchema);

Repo.collection.dropAllIndexes(function (err, results) {
    if (err) {
        logger.warn('Repo collection dropAllIndexes error: ', err);
        logger.warn('dropAllIndexes results: ', results);
    }
});

Repo.collection.createIndex(index, indexOptions);

module.exports = {
    Repo: Repo
};