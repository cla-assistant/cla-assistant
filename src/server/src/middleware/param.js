// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const merge = require('merge')

module.exports = (req, _res, next) => {
    req.args = merge(req.body, req.query)
    next()
}
