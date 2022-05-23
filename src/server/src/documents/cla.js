// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

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

// add a full wildcard index for better indexing
CLA.collection.createIndex({ '$**' : 1 })
module.exports = {
    CLA: CLA
}
