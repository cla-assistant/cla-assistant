const _ = require('lodash')

module.exports = {
    checkPattern: (patternList, item) => {
        if (!patternList || !item || !item.includes) {
            return false
        }
        const patterns = patternList.split(',')

        return patterns.filter(pattern => item.includes(pattern)).length > 0
    },
    checkPatternWildcard: (patternList, item) => {
        if (!patternList || !item || !item.includes) {
            return false
        }
        const patterns = patternList.split(',')

        return patterns.filter(function (pattern) {
            pattern = pattern.trim()
            if (pattern.includes('*')) {
                const regex = _.escapeRegExp(pattern).split('\\*').join('.*')

                return new RegExp(regex).test(item)
            }

            return pattern === item
        }).length > 0
    }
}