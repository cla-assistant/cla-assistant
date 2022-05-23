// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const github = require(`./githubUtils`)
const cla = require(`./claUtils`)

let testUserName = process.env.TEST_USER_NAME
let testContributorName = process.env.TEST_CONTRIBUTOR_NAME
let testContributorPass = process.env.TEST_CONTRIBUTOR_PASS
let testHost = process.env.TEST_HOST
let testCLAUser = process.env.TEST_CLA_USER


Feature(`Revoke and Resign CLA`)

Scenario(`revoke cla for repo1`, (I) => {
    session('contributor', () => {
        github.login(I, testContributorName, testContributorPass)
        I.amOnPage(testHost)
        I.click('Sign in')
        I.seeInCurrentUrl('/login/oauth/authorize')
        I.waitForEnabled('button#js-oauth-authorize-btn', 5)
        I.click('button#js-oauth-authorize-btn')
        I.wait(1)
        I.seeInCurrentUrl(testHost)
        I.wait(3)
        cla.revokeCLA(I, testUserName, `repo1`)
    })
})

Scenario('create PR and resign CLA', (I) => {
    session('contributor', () => {
        github.login(I, testContributorName, testContributorPass)
        github.createPR(I, testUserName, 'repo1')
        
        I.wait(3)
        I.waitForElement('a.status-actions', 20)
        I.see('Pending')
        I.waitForVisible('//h3[contains(@class, "timeline-comment-header-text") and contains(., "' + testCLAUser + '")]', 10)
        I.see('Thank you for your submission')

        I.click('a.status-actions')
        I.seeInCurrentUrl(testHost + '/'+ testUserName +'/repo1?pullRequest=2')
        I.click('//button[@class="btn btn-info btn-lg"]')
        I.wait(5)

        I.waitInUrl('github.com', 10)
        I.seeInCurrentUrl('github.com/'+ testUserName +'/repo1')
        I.see('All committers have signed the CLA')
    })
})

