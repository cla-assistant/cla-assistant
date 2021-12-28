const utils = require('../../../server/documents/utils');
const assert = require('assert');

describe('documents:utils', () => {
    describe('When patterns do NOT include wildcards', () => {
        it('should do the exact match', () => {
            const patterns = 'Intel, Microsoft';
            assert.equal(utils.checkPatternWildcard(patterns, 'Intel-like-org'), false);
            assert.equal(utils.checkPatternWildcard(patterns, 'Intel'), true);
            assert.equal(utils.checkPatternWildcard(patterns, 'Microsoft'), true);
        });
    });

    describe('When patterns include wildcards', () => {
        it('should do the regex match', () => {
            const patterns = 'Intel*, Microsoft*';
            assert.equal(utils.checkPatternWildcard(patterns, 'Intel-like-user-name'), true);
            assert.equal(utils.checkPatternWildcard(patterns, 'Microsoft-like-user-name'), true);
        });
    });
});