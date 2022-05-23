// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

let testHost = process.env.TEST_HOST

module.exports = {
    linkRepo: function (I, owner, repo) {
        I.amOnPage(testHost)
        I.wait(10)
        I.refreshPage()
        I.wait(5)
        I.waitForVisible('//button[contains(., "Configure CLA")]', 5)
        I.waitForInvisible('.loading-indicator', 5)
        I.click('//button[contains(., "Configure CLA")]')
        I.wait(1)

        I.see('Choose a repository')
        I.click('//*[@id="activated_cla"]/div[3]/div[2]/div[2]/div/div[1]')
        I.wait(1)
        I.see(`${owner}/${repo}`)
        I.pressKey('Enter')

        I.see('Choose a CLA')
        I.click('//*[@id="activated_cla"]/div[3]/div[3]/div[2]/div/div[1]')
        I.wait(1)
        I.see('SAP individual CLA')
        I.pressKey('ArrowDown')
        I.pressKey('Enter')

        I.waitForVisible('//button[contains(., "LINK")]', 5)
        I.click('//button[contains(., "LINK")]')
        I.wait(1)
        I.waitForVisible('//button[contains(., "Yes")]', 5)
        I.click('//button[contains(., "Yes")]')
        I.wait(1)
        I.waitForVisible('//button[contains(., "Great")]', 5)
        I.click('//button[contains(., "Great")]')

        I.waitForVisible('table.table', 5)
        I.see('Linked Repositories')
        I.see(`${owner} / ${repo}`)
        I.wait(20)
    },

    removeLinkedRepo: function (I, owner, repo) {
        I.amOnPage(testHost)
        I.waitForVisible('table.table', 5)
        I.see('Linked Repositories')
        I.waitForInvisible('.loading-indicator', 5)
        I.waitForVisible('//i[contains(@class, "fa fa-ellipsis-h action-icon")]', 5)
        I.see(`${owner} / ${repo}`)

        I.moveCursorTo('//i[contains(@class, "fa fa-ellipsis-h action-icon")]')
        I.click('//i[contains(@class, "fa fa-ellipsis-h action-icon")]')
        I.wait(3)
        I.click('//button[contains(., "Unlink")]')
        I.wait(3)
        I.see('Unlinking will...')
        I.waitForVisible('//button[contains(., "Unlink anyway")]')
        I.click('//button[contains(., "Unlink anyway")]')
        I.wait(2)
        I.see('Linked Repositories')
        I.dontSee(`${owner} / ${repo}`)
    },

    revokeCLA: function (I, owner, repo) {
        I.see('View my signed CLAs')
        I.click('View my signed CLAs')
        I.wait(5)
        I.see(`${owner} / ${repo}`)
        I.click('//i[contains(@class, "fa-trash-o")]')
        I.wait(3)
        I.click('Revoke anyway')
        I.wait(5)
        I.dontSee(`${owner} / ${repo}`)
    },
};