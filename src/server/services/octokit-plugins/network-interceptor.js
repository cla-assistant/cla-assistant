const logger = require('../logger')

function rateLimitLogger(octokit) {
    octokit.hook.after('request', async (response, options) => {
        logger.info(`${options.method} ${options.url}: ${response.status} || Rate Limit: ${response.headers['x-ratelimit-remaining']}/${response.headers['x-ratelimit-limit']} reset at ${new Date(Number(response.headers['x-ratelimit-reset']) * 1000).toTimeString()}`)
    })
}

module.exports = {
    rateLimitLogger,
}
