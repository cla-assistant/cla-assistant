// module
import github = require('../services/github')
import { merge } from 'merge'

module.exports = {
    call: async (req) => {
        const res = await github.call(merge(req.args, { token: req.user.token }))

        return { data: res.data, meta: res.headers }
    }
}
