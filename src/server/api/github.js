// module
const github = require('../services/github')
const merge = require('merge')
const User = require('mongoose').model('User')

module.exports = {
    call: async (req) => {
        const res = await github.call(merge(req.args, { token: req.user.token }))
        return { data: res.data, meta: res.headers}
    },

    scope: async (req) => {
        let user
        try {
            user = await User.findOne({
                name: req.user.login
            })
    
            if (user) {
                const scope = {
                    role: req.session.requiredScope,
                    // appInstalled: config.server.github.authentication_type === 'GitHubApp' ?  user.appInstalled : 'OAuthApp'
                }
                return { data: scope }
            }
        } catch (error) {
            logger.warn(error.stack)
        }
    }
}
