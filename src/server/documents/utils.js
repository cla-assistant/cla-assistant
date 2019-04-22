let _ = require('lodash');

module.exports = {
    checkPattern: function (patternList, item) {
        if (!patternList || !item || !item.includes) {
            return false;
        }
        let patterns = patternList.split(',');

        return patterns.filter(function (pattern) { return item.includes(pattern); }).length > 0;
    },
    checkPatternWildcard: function (patternList, item) {
        if (!patternList || !item || !item.includes) {
            return false;
        }
        const patterns = patternList.split(',');

        return patterns.filter(function (pattern) {
            pattern = pattern.trim();
            if (pattern.includes('*')) {
                const regex = _.escapeRegExp(pattern).split('\\*').join('.*');
                return new RegExp(regex).test(item);
            } else {
                return pattern === item;
            }
        }).length > 0;
    }
};