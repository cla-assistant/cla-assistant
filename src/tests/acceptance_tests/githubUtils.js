// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    login: function (I, name, password) {
        I.amOnPage('https://github.com/login')
        I.fillField('login', name)
        I.fillField('password', password)
        I.click('commit')
        I.seeInCurrentUrl('https://github.com')
        I.wait(1)
    },

    createRepo: function (I, owner, repo) {
        I.amOnPage('https://github.com/new')
        I.fillField('repository[name]', repo)
        I.checkOption('repository[auto_init]')
        I.scrollPageToBottom()
        I.waitForEnabled('//*[@id="new_repository"]/div[4]/button', 5)
        I.click('Create repository')
        I.wait(1)
        I.seeInCurrentUrl(`https://github.com/${owner}/${repo}`)
        I.wait(20)
    },

    deleteRepo: function (I, owner, repo) {
        I.amOnPage(`https://github.com/${owner}/${repo}`)
        I.seeInCurrentUrl(`/${owner}/${repo}`)
        I.amOnPage(`https://github.com/${owner}/${repo}/settings`)
        I.waitForEnabled('//summary[contains(., "Delete this repository")]', 5)
        I.click('//summary[contains(., "Delete this repository")]')
        I.waitForVisible('//input[contains(@aria-label, "delete this repository")]', 5)
        I.fillField('//input[contains(@aria-label, "delete this repository")]', owner + '/' + repo)
        I.click('I understand the consequences, delete this repository')
        I.seeInCurrentUrl('https://github.com')
    },

    revokePermissions: function (I) {
        I.amOnPage('https://github.com/settings/applications')
        I.wait(1)
        I.click('//summary[contains(@aria-label, "Show more options")]')
        I.wait(1)
        I.click('//summary[contains(., "Revoke") and contains(@class, "dropdown-item")]')
        I.wait(1)
        I.click('I understand, revoke access')
        I.wait(1)
        I.refreshPage()
        I.see('No authorized applications')
    },

    createPR: function (I, owner, repo) {
        I.amOnPage(`https://github.com/${owner}/${repo}/blob/master/README.md`)
        I.waitForEnabled('//button[starts-with(@aria-label, "Edit the file") or starts-with(@aria-label, "Fork this project")]', 5)
        I.click('//button[starts-with(@aria-label, "Edit the file") or starts-with(@aria-label, "Fork this project")]') //click ~Fork this project and edit the file

        I.waitForVisible('.CodeMirror-line', 5)
        I.wait(1)
        I.click('.CodeMirror-line')
        I.wait(1)
        I.pressKey(['Space', 't', 'e', 's', 't', 'Enter']);
        I.waitForEnabled('//button[contains(., "Propose changes")]', 5)
        I.click('Propose changes')
        I.waitForEnabled('//button[contains(., "Create pull request")]', 5)
        I.click('Create pull request')
        I.wait(2)
        I.click('//button[contains(., "Create pull request") and contains(@class, "hx_create-pr-button")]')
    }
};