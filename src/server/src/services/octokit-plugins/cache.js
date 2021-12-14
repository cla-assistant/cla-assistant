require('../../documents/cache')
const logger = require('../logger')
const Cache = require('mongoose').model('Cache')


function cache(octokit, OctokitOptions) {
    octokit.hook.wrap('request', async (request, options) => {
        const isUseETag = options.isUseETag
        if (isUseETag) {
            let cachedData, response
            delete options.isUseETag
            const cacheKeyObject = {
                options: options,
                OctokitOptions: OctokitOptions,
            }
            const cacheKey = JSON.stringify(cacheKeyObject)

            if (!config.server.nocache) {
                try {
                    cachedData = await Cache.findOne({
                        cache_key: cacheKey
                    })
                } catch(error) {
                    logger.info(`Cannot find cache with key ${cacheKey}`)
                }
                if (cachedData) {
                    options.headers = {
                        'If-None-Match': cachedData.cache_value.headers.etag
                    }
                }
            }

            try {
                response = await request(options)
                if (cachedData) { // Response is changed, updating cache
                    cachedData.cache_value = response
                    cachedData.save()
                }
            } catch(error){
                if (error.status === 304 && cachedData) {
                    logger.info(`Conditional request using etag for ${options}`)
                    return cachedData.cache_value
                }
                logger.error(new Error(error).stack)
                throw new Error(`${options}: ${error}`)
            }

            if (isUseETag && response && response.headers && response.headers.etag) {
                const isCacheExisted = await Cache.exists({
                    cache_key: cacheKey
                })
                if (!isCacheExisted) {
                    try {
                        await Cache.create({
                            cache_key: cacheKey,
                            cache_value: response
                        })
                    } catch (error) {
                        logger.warn(new Error(`Could not create cache ${error}`).stack)
                    }
                }
            }

            return response
        }
        return await request(options)
    });
}

module.exports = {
    cache
}