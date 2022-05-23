// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const github = require('./githubUtils')

let testUserName = process.env.TEST_USER_NAME
let testUserPass = process.env.TEST_USER_PASS
let testHost = process.env.TEST_HOST

Feature('Authorize cla owner')


Scenario('Authorize cla assistant for cla owner', (I) => {
    github.login(I, testUserName, testUserPass)
    I.amOnPage(testHost)
    I.click('Sign in')
    I.seeInCurrentUrl('/login/oauth/authorize')
    I.waitForEnabled('button#js-oauth-authorize-btn', 5)
    I.click('button#js-oauth-authorize-btn')
    I.wait(1)
    I.seeInCurrentUrl('/login/oauth/authorize')
    I.waitForEnabled('button#js-oauth-authorize-btn', 5)
    I.click('button#js-oauth-authorize-btn')
    I.seeInCurrentUrl(testHost)
})
