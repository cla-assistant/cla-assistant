const github = require('./githubUtils')

let testUserName = process.env.TEST_USER_NAME
let testUserPass = process.env.TEST_USER_PASS

Feature('Authorize claowner1')


Scenario('Autorize cla assistant for claowner1', (I) => {
    github.login(I, testUserName, testUserPass)
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
