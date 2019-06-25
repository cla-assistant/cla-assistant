// module
const github = require('../services/github')
const merge = require('merge')

module.exports = {
    call: async (req) => {
        const res = await github.call(merge(req.args, { token: req.user.token }))

        return { data: res.data, meta: res.headers }
    }
}
