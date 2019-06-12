const githubService = require('../services/github')
const log = require('../services/logger')
const Joi = require('joi')

class Utils {
    couldBeAdmin(username) {
        return config.server.github.admin_users.length === 0 || config.server.github.admin_users.indexOf(username) >= 0
    }

    async checkRepoPushPermissionByName(repo, owner, token) {
        try {
            const res = await githubService.call({
                obj: 'repos',
                fun: 'get',
                arg: {
                    repo: repo,
                    owner: owner
                },
                token: token
            })
            if (!res.data) {
                throw new Error('No data returned')
            }
            if (!res.data.permissions || !res.data.permissions.push) {
                throw new Error('User has no push permission for this repo')
            }
            return res.data
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
        return res.data.permissions.push
    }

    async checkOrgAdminPermission(org, username, token) {
        try {
            const res = await githubService.call({
                obj: 'orgs',
                fun: 'getMembership',
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
        const joiRes = Joi.validate(args, schema, { abortEarly: false, allowUnknown, convert })
        if (joiRes.error) {
            joiRes.error.code = 400
            throw joiRes.error
        }
    }
}

module.exports = new Utils()