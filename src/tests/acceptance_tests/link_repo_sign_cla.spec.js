const utils = require('./utils')

let testUserName = process.env.TEST_USER_NAME
let testUserPass = process.env.TEST_USER_PASS
let testContributorName = process.env.TEST_CONTRIBUTOR_NAME
let testContributorPass = process.env.TEST_CONTRIBUTOR_PASS


Feature('Create and link repo1')

Scenario('create a repo', (I) => {
    utils.loginGithub(I, testUserName, testUserPass)
    utils.createRepo(I, testUserName, 'repo1')
})

Scenario('Autorize cla assistant for claowner1', (I) => {
    I.amOnPage('https://preview.cla-assistant.io/')
    I.click('Sign in')
    I.seeInCurrentUrl('/login/oauth/authorize')
    I.waitForEnabled('button#js-oauth-authorize-btn', 5)
    I.click('button#js-oauth-authorize-btn')
    I.wait(1)
    I.seeInCurrentUrl('/login/oauth/authorize')
    I.waitForEnabled('button#js-oauth-authorize-btn', 5)
    I.click('button#js-oauth-authorize-btn')
    I.seeInCurrentUrl('https://preview.cla-assistant.io/')
})

Scenario('Link repo1', (I) => {
    I.amOnPage('https://preview.cla-assistant.io/')
    I.waitForVisible('//button[contains(., "Configure CLA")]', 5)
    I.waitForInvisible('.loading-indicator', 5)
    I.click('//button[contains(., "Configure CLA")]')

    I.see('Choose a repository')
    I.click('//*[@id="activated_cla"]/div[3]/div[2]/div[2]/div/div[1]')
    I.wait(0.5)
    I.see('claowner1/repo1')
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
    I.see('claowner1 / repo1')
})

Feature('Pull Request')

Scenario('create a PR', (I) => {
    session('contributor', () => {
        utils.loginGithub(I, testContributorName, testContributorPass)

        I.amOnPage('https://github.com/claowner1/repo1/blob/master/README.md')
        I.waitForEnabled('//button[starts-with(@aria-label, "Edit the file") or starts-with(@aria-label, "Fork this project")]', 5)
        I.click('//button[starts-with(@aria-label, "Edit the file") or starts-with(@aria-label, "Fork this project")]') //click ~Fork this project and edit the file

        I.waitForVisible('.CodeMirror-line', 5)
        I.wait(1)
        I.click('.CodeMirror-line')
        I.wait(1)
        I.pressKey(['Space', 't', 'e', 's', 't', 'Enter']);
        I.waitForEnabled('//button[contains(., "Propose file change")]', 5)
        I.click('Propose file change')
        I.waitForEnabled('//button[contains(., "Create pull request")]', 5)
        I.click('Create pull request')
        I.click('//*[@id="new_pull_request"]/div[1]/div/div/div[3]/button')

        I.wait(3)
        I.waitForElement('a.status-actions', 20)
        I.see('Pending')
        I.waitForVisible('//h3[contains(@class, "timeline-comment-header-text") and contains(., "CLAassistant")]', 10)
        I.see('Thank you for your submission')

        I.click('a.status-actions')
        I.seeInCurrentUrl('preview.cla-assistant.io/claowner1/repo1')
        I.click('//button[@class="btn btn-info btn-lg"]')
        I.waitForEnabled('//button[contains(., "Authorize")]', 5)
        I.click('//button[contains(., "Authorize")]')

        I.waitInUrl('github.com', 10)
        I.seeInCurrentUrl('github.com/claowner1/repo1')
        I.see('All committers have signed the CLA')
    })
})

Feature('Cleanup Linked Repos')

Scenario('cleanup CLA assistant', (I) => {
    I.amOnPage('https://preview.cla-assistant.io/')
    I.waitForVisible('table.table', 5)
    I.see('Linked Repositories')
    I.waitForInvisible('.loading-indicator', 5)
    I.waitForVisible('.fa-trash-o', 5)
    I.see('claowner1 / repo1')

    I.moveCursorTo('.fa-trash-o')
    I.click('.fa-trash-o')
    I.wait(3)
    I.see('Unlinking will...')
    I.waitForVisible('//button[contains(., "Unlink")]')
    I.click('//button[contains(., "Unlink")]')
    I.wait(2)
    I.see('Linked Repositories')
    I.dontSee('claowner1 / repo1')

})

Scenario('cleanup Github', (I) => {
    utils.deleteRepo(I, testUserName, 'repo1')
    utils.revokePermissions(I)

    session('contributor', () => {
        utils.loginGithub(I, testContributorName, testContributorPass)
        utils.deleteRepo(I, testContributorName, 'repo1')
        utils.revokePermissions(I)
    })
})