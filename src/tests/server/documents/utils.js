// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const utils = require('../../../server/src/documents/utils');
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
