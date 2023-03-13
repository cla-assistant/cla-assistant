const mongoose = require('mongoose')

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


const CLA = mongoose.model('CLA', CLASchema)

/* CLA.collection.dropAllIndexes(function (err, results) {
    if (err) {
        logger.warn('CLA collection dropAllIndexes error: ', err)
        logger.warn('dropAllIndexes results: ', results)
    }
}) */

Object.keys(CLASchema.obj).forEach(function (field) {
    console.log({ [field]: 1 })
    CLA.collection.createIndex({ [field]: 1 })
})

module.exports = {
    CLA: CLA
}
