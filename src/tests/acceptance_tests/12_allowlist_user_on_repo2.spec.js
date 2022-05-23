// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const github = require(`./githubUtils`)
const cla = require(`./claUtils`)

let testUserName = process.env.TEST_USER_NAME
let testUserPass = process.env.TEST_USER_PASS
let testContributorName = process.env.TEST_CONTRIBUTOR_NAME
let testContributorPass = process.env.TEST_CONTRIBUTOR_PASS
let testHost = process.env.TEST_HOST


Feature(`Create and link repo2`)

Scenario(`create repo2`, (I) => {
    github.createRepo(I, testUserName, `repo2`)
})

Scenario(`link repo2`, (I) => {
    cla.linkRepo(I, testUserName, `repo2`)
})

Scenario(`Add user on allowlist for repo2`, (I) => {
    I.amOnPage(testHost)
    I.waitForVisible(`//button[contains(., "Configure CLA")]`, 5)
    I.waitForInvisible(`.loading-indicator`, 5)
    I.waitForVisible(`table.table`, 5)
    I.see(`Linked Repositories`)
    I.see(`${testUserName} / repo2`)
    I.wait(5)

    I.moveCursorTo(`//tr[contains(., "${testUserName} / repo2")]//i[contains(@class,"octicon-pencil")]`)
    I.click(`//tr[contains(., "${testUserName} / repo2")]//i[contains(@class,"octicon-pencil")]`)
    I.waitForEnabled(`#allowListPattern`, 2)
    I.fillField(`#allowListPattern`, testContributorName)
    I.wait(2)
    I.waitForElement(`//button[contains(.,"Save")]`)
    I.moveCursorTo(`//button[contains(.,"Save")]`)
    I.click(`//button[contains(.,"Save")]`)
    I.waitForInvisible(`#allowListPattern`, 5)
})

Feature(`Pull Request`)

Scenario(`create a PR`, (I) => {
    session(`contributor`, () => {
        github.login(I, testContributorName, testContributorPass)
        github.createPR(I, testUserName, `repo2`)

        I.wait(3)
        I.waitForElement(`//button[contains(.,"Show all checks")]`, 20)
        I.click(`//button[contains(.,"Show all checks")]`)
        I.wait(1)
        I.see(`successful check`)
        I.see(`All CLA requirements met`)
    })
})
