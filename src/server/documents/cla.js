const mongoose = require('mongoose')
// const logger = require('../services/logger')
mongoose.Promise = require('q').Promise

const CLASchema = mongoose.Schema({
    created_at: Date,
    revoked_at: Date,
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
})

// cosmosDB supports only up to 8 combined indexes
const index = {
    repoId: 1,
    ownerId: 1,
    userId: 1,
    gist_url: 1,
    gist_version: 1,
    org_cla: 1,
    revoked_at: 1,
}
const indexOptions = {
    unique: true,
    // partialFilterExpression: { userId: { $exists: true } },
    background: true,
}

const CLA = mongoose.model('CLA', CLASchema)

/* CLA.collection.dropAllIndexes(function (err, results) {
    if (err) {
        logger.warn('CLA collection dropAllIndexes error: ', err)
        logger.warn('dropAllIndexes results: ', results)
    }
}) */
CLA.collection.createIndex(index, indexOptions)
// add a full wildcard index for better indexing
CLA.collection.createIndex({ "$**" : 1 })
module.exports = {
    CLA: CLA
}
