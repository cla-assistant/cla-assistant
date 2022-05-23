// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    uuid: Number,
    name: String,
    requests: [{
        repo: String,
        owner: String,
        numbers: [Number]
    }],
    token: String
})

UserSchema.index({
    name: 1,
    uuid: 1
}, {
        unique: true
    })

const User = mongoose.model('User', UserSchema)

module.exports = {
    User: User
}
