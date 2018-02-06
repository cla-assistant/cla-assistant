let mongoose = require('mongoose');
// let logger = require('../services/logger');
mongoose.Promise = require('q').Promise;

let CLASchema = mongoose.Schema({
    created_at: Date,
    end_at: Date,
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
    origin: String,
    updated_at: Date
});

// let index = {
//     repo: 1,
//     repoId: 1,
//     owner: 1,
//     ownerId: 1,
//     user: 1,
//     gist_url: 1,
//     gist_version: 1,
//     org_cla: 1
// };
// let indexOptions = {
//     unique: true,
//     background: true
// };

let CLA = mongoose.model('CLA', CLASchema);

/**
 *  TODO: Remove this for now because Document DB don't support creating index with this many index properties.
 *        And dropAllIndexes() will exclude any query path, which means almost all queries will not work.
 * */

// CLA.collection.dropAllIndexes(function (err, results) {
//     if (err) {
//         logger.warn('CLA collection dropAllIndexes error: ', err);
//         logger.warn('dropAllIndexes results: ', results);
//     }
// });
// CLA.collection.createIndex(index, indexOptions);

module.exports = {
    CLA: CLA
};