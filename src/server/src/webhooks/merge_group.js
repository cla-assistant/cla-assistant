// SPDX-FileCopyrightText: 2023 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

//////////////////////////////////////////////////////////////////////////////////////////////
// GitHub merge_group Webhook Handler
// We don't actually check the CLA status of merge_group, but rather green light it directly
// For a PR to be in the merge queue the CLA check must have passed on the PR level already
// thus we don't need to check it again during the merge_group
//////////////////////////////////////////////////////////////////////////////////////////////

// services
const status = require('../services/status')
const cla = require('../services/cla')
const logger = require('../services/logger')

module.exports = {
    accepts: function (req) {
        // Currently merge_group only has `checks_requested`
        // We check anyway to ensure that future adding of more types doesn't impact us
        return ['checks_requested'].indexOf(req.args.action) > -1 && (req.args.repository && req.args.repository.private == false)
    },
    handle: async function (req, res) {
        res.status(200).send('OK - Will be working on it')
        const args = {
            owner: req.args.repository.owner.login,
            repoId: req.args.repository.id,
            repo: req.args.repository.name,
            sha: req.args.merge_group.head_commit.id
        }
        args.orgId = req.args.organization ? req.args.organization.id : req.args.repository.owner.id
        args.handleDelay = req.args.handleDelay != undefined ? req.args.handleDelay : 1 // needed for unitTests

        try {
            const item = await cla.getLinkedItem(args)
            let nullCla = !item.gist
            let isExcluded = item.orgId && item.isRepoExcluded && item.isRepoExcluded(args.repo)
            if (!nullCla && !isExcluded) {
                args.token = item.token
                args.gist = item.gist
                if (item.repoId) {
                    args.orgId = undefined
                }
                await status.updateForMergeQueue(args)
            }
        } catch (e) {
            logger.warn(e)
        }
    }
}
