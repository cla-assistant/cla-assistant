// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

//////////////////////////////////////////////////////////////////////////////////////////////
// GitHub Ping Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

module.exports = {
    accepts: function () {
        return true
    },
    handle: function (req, res) {
        res.status(200).send('OK');
    }
}
