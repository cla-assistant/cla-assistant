const merge = require('merge')

module.exports = (req, _res, next) => {
    req.args = merge(req.body, req.query)
    next()
}
