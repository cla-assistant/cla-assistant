// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const github = require('./githubUtils')
const cla = require('./claUtils')

let testUserName = process.env.TEST_USER_NAME
let testUserPass = process.env.TEST_USER_PASS
let testContributorName = process.env.TEST_CONTRIBUTOR_NAME
let testContributorPass = process.env.TEST_CONTRIBUTOR_PASS
let testHost = process.env.TEST_HOST
let testCLAUser = process.env.TEST_CLA_USER


Feature('Create and link repo1')

Scenario('create a repo', (I) => {
    // github.login(I, testUserName, testUserPass)
    github.createRepo(I, testUserName, 'repo1')
})

Scenario('Link repo1', (I) => {
    cla.linkRepo(I, testUserName, 'repo1')
})

Feature('Pull Request')

Scenario('create a PR', (I) => {
    session('contributor', () => {
        github.login(I, testContributorName, testContributorPass)
        github.createPR(I, testUserName, 'repo1')

        I.wait(3)
        I.waitForElement('a.status-actions', 20)
        I.see('Pending')
        I.waitForVisible('//h3[contains(@class, "timeline-comment-header-text") and contains(., "' + testCLAUser + '")]', 10)
        I.see('Thank you for your submission')

        I.click('a.status-actions')
        I.seeInCurrentUrl(testHost + '/'+ testUserName +'/repo1?pullRequest=1')
        I.click('//button[@class="btn btn-info btn-lg"]')
        I.waitForEnabled('//button[contains(., "Authorize")]', 5)
        I.click('//button[contains(., "Authorize")]')

        I.waitInUrl('github.com', 10)
        I.seeInCurrentUrl('github.com/'+ testUserName +'/repo1')
        I.see('All committers have signed the CLA')
    })
})
