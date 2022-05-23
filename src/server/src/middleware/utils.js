// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const githubService = require('../services/github')
const log = require('../services/logger')

class Utils {
    couldBeAdmin(username) {
        return config.server.github.admin_users.length === 0 || config.server.github.admin_users.indexOf(username) >= 0
    }

    async checkRepoPushPermissionByName(repo, owner, repoId, token) {
        try {
            let res, repoData
            if (!repo || !owner) {
                repoData = await this.checkRepoPushPermissionById(repoId, token)
            } else {
            res = await githubService.call({
                obj: 'repos',
                fun: 'get',
                arg: {
                    repo: repo,
                    owner: owner
                },
                token: token
            })
                repoData = res.data
            }
            if (!repoData) {
                    throw new Error('No data returned')
                }
            if (!repoData.permissions || !repoData.permissions.push) {
                    throw new Error('User has no push permission for this repo')
                }
            return repoData
        } catch (error) {
            if (error.status === 404) {
                log.info('User has no authorization for ' + repo + ' repository.')
                log.warn(error.stack)
            }
            throw error
        }
    }

    async checkRepoPushPermissionById(repoId, token) {
        const res = await githubService.call({
            obj: 'repos',
            fun: 'getById',
            arg: {
                id: repoId
            },
            token: token
        })
        // return res.data.permissions.push
        return res.data
    }

    async checkOrgAdminPermission(org, username, token) {
        try {
            const res = await githubService.call({
                obj: 'orgs',
                fun: 'getMembershipForUser',
                arg: {
                    org: org,
                    username: username
                },
                token: token
            })
            if (!res.data) {
                throw new Error('No data returned')
            }
            if (res.data.role !== 'admin') {
                throw new Error('User is not an admin of this org')
            }

            return res.data
        } catch (error) {
            if (error.status === 404) {
                log.info('User has no authorization for ' + org + ' repository.')
            }
            throw error
        }

    }

    validateArgs(args, schema, allowUnknown = false, convert = true) {
        const joiRes = schema.validate(args, { abortEarly: false, allowUnknown, convert })
        if (joiRes.error) {
            joiRes.error.code = 400
            throw joiRes.error
        }
    }
}

module.exports = new Utils()
