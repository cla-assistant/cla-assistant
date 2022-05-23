// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

// module
const webhookService = require('../services/webhook')
class WebhookApi {
    async get(req) {
        return req.args && req.args.org ? webhookService.getOrgHook(req.args.org, req.user.token) : webhookService.getRepoHook(req.args.owner, req.args.repo, req.user.token)

        // now we will have to check two things:
        // 1) webhook user still has push access to this repo
        // 2) token is still valid
        // -> if one of these conditions is not met we will
        //    delete the webhook

        // if(hook) {
        // }
    }

    async create(req) {
        return req.args && req.args.orgId ? webhookService.createOrgHook(req.args.org, req.user.token) : webhookService.createRepoHook(req.args.owner, req.args.repo, req.user.token)
    }

    async remove(req) {
        return req.args && req.args.org ? webhookService.removeOrgHook(req.args.org, req.user.token) : webhookService.removeRepoHook(req.args.owner, req.args.repo, req.user.token)
    }
}

module.exports = new WebhookApi()