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

        return patterns.filter((pattern) => {
            let regex = _.escapeRegExp(pattern)
            regex = regex.includes('\\*') ? regex.split('\\*').join('.*') : pattern

            return new RegExp(regex).test(item)
        }).length > 0
    }
}