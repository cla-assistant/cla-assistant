// module
let github = require('../services/github');
let merge = require('merge');

module.exports = {
    call: async function (req) {
        const res = await github.call(merge(req.args, {
            token: req.user.token
        }))

        return { data: res.data, meta: res.headers }
    }
};
