const mongoose = require('mongoose')

const cacheSchema = mongoose.Schema({
    cache_key: String,
    cache_value: Object
})

const Cache = mongoose.model('Cache', cacheSchema)

module.exports = {
    Cache: Cache
}
