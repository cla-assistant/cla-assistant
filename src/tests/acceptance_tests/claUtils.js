module.exports = {
    linkRepo: function (I, owner, repo) {
        I.amOnPage('https://preview.cla-assistant.io/')
        I.waitForVisible('//button[contains(., "Configure CLA")]', 5)
        I.waitForInvisible('.loading-indicator', 5)
        I.click('//button[contains(., "Configure CLA")]')

        I.see('Choose a repository')
        I.click('//*[@id="activated_cla"]/div[3]/div[2]/div[2]/div/div[1]')
        I.wait(0.5)
        I.see(`${owner}/${repo}`)
        I.pressKey('Enter')

        I.see('Choose a CLA')
        I.click('//*[@id="activated_cla"]/div[3]/div[3]/div[2]/div/div[1]')
        I.wait(0.5)
        I.see('SAP individual CLA')
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
    },

    removeLinkedRepo: function (I, owner, repo) {
        I.amOnPage('https://preview.cla-assistant.io/')
        I.waitForVisible('table.table', 5)
        I.see('Linked Repositories')
        I.waitForInvisible('.loading-indicator', 5)
        I.waitForVisible('.fa-trash-o', 5)
        I.see(`${owner} / ${repo}`)

        I.moveCursorTo('.fa-trash-o')
        I.click('.fa-trash-o')
        I.wait(3)
        I.see('Unlinking will...')
        I.waitForVisible('//button[contains(., "Unlink")]')
        I.click('//button[contains(., "Unlink")]')
        I.wait(2)
        I.see('Linked Repositories')
        I.dontSee(`${owner} / ${repo}`)
    },
};