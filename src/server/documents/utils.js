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
        let patterns = patternList.split(',');

        return patterns.filter(function (pattern) {
            let regex = _.escapeRegExp(pattern);
            regex = regex.includes('\\*') ? regex.split('\\*').join('.*') : pattern;

            return new RegExp(regex).test(item);
        }).length > 0;
    }
};