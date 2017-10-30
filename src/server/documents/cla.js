var mongoose = require('mongoose');
var logger = require('../services/logger');
mongoose.Promise = require('q').Promise;

var CLASchema = mongoose.Schema({
    created_at: Date,
    custom_fields: String,
    gist_url: String,
    gist_version: String,
    owner: String,
    ownerId: String,
    repo: String,
    repoId: String,
    org_cla: Boolean,
    user: String,
    userId: String,
});

var index = {
    repo: 1,
    repoId: 1,
    owner: 1,
    ownerId: 1,
    user: 1,
    gist_url: 1,
    gist_version: 1,
    org_cla: 1
};
var indexOptions = {
    unique: true,
    background: true
};

var CLA = mongoose.model('CLA', CLASchema);

CLA.collection.dropAllIndexes(function (err, results) {
    if (err) {
        logger.warn('CLA collection dropAllIndexes error: ', err);
        logger.warn('dropAllIndexes results: ', results);
    }
});
CLA.collection.createIndex(index, indexOptions);

module.exports = {
    CLA: CLA
};