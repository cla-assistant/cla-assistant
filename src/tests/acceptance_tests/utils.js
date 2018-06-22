module.exports = {
    loginGithub: function (I, name, password) {
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
        I.waitForEnabled('//*[@id="new_repository"]/div[3]/button', 5)
        I.click('Create repository')
        I.wait(1)
        I.seeInCurrentUrl(`https://github.com/${owner}/${repo}`)
    },

    deleteRepo: function (I, owner, repo) {
        I.amOnPage(`https://github.com/${owner}/${repo}`)
        I.seeInCurrentUrl(`/${owner}/${repo}`)
        I.amOnPage(`https://github.com/${owner}/${repo}/settings`)
        I.click('//*[@id="options_bucket"]/div[10]/ul/li[4]/details/summary')
        I.fillField('//*[@id="options_bucket"]/div[10]/ul/li[4]/details/details-dialog/div[3]/form/p/input', repo)
        I.click('I understand the consequences, delete this repository')
        I.seeInCurrentUrl('https://github.com')
    },

    revokePermissions: function (I) {
        I.amOnPage('https://github.com/settings/applications')
        I.click('Revoke')
        I.waitForEnabled('//*[@id="facebox"]/div/div/div/form/button', 5)
        I.click('//*[@id="facebox"]/div/div/div/form/button')
        I.wait(1)
        I.refreshPage()
        I.see('No authorized applications')
    }
};