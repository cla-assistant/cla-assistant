var mongoose = require('mongoose');
var logger = require('../services/logger');

var CLASchema = mongoose.Schema({
    repo: String,
    repoId: String,
    owner: String,
    ownerId: String,
    user: String,
    userId: String,
    gist_url: String,
    gist_version: String,
    created_at: Date,
    org_cla: {type: Boolean, default: false },
});

var index = {
    repo: 1,
    owner: 1,
    user: 1,
    gist_url: 1,
    gist_version: 1,
    org_cla: 1
};
var indexOptions = {
    unique: true
};

var CLA = mongoose.model('CLA', CLASchema);

CLA.collection.dropAllIndexes(function(err, results) {
    if (err) {
        logger.warn('CLA collection dropAllIndexes error: ', err);
        logger.warn('dropAllIndexes results: ', results);
    }
});
CLA.collection.createIndex(index, indexOptions);

module.exports = {
    CLA: CLA
};
