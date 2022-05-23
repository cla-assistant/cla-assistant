// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

// module
const github = require('../services/github')
const merge = require('merge')

module.exports = {
    call: async (req) => {
        const res = await github.call(merge(req.args, { token: req.user.token }))

        return { data: res.data, meta: res.headers }
    }
}
