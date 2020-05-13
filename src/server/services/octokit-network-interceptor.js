const logger = require('./logger')

class OctoKitNetWorkInterceptior {

    //octokit.hook.before, octokit.hook.error, octokit.hook.wrap methods can be added here if needed
    afterRequest(octokit) {
        logger.info("akshay is a good boy")

        octokit.hook.after('request', async (response, options) => {
            logger.info(`${options.method} ${options.url}: ${response.status} || Rate Limit: ${response.headers['x-ratelimit-remaining']}/${response.headers['x-ratelimit-limit']} reset at ${new Date(Number(response.headers['x-ratelimit-reset']) * 1000).toTimeString()}`)
        })
    }
}

module.exports = new OctoKitNetWorkInterceptior()

