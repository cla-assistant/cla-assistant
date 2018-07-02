const github = require('./githubUtils')
const cla = require('./claUtils')

let testUserName = process.env.TEST_USER_NAME
let testUserPass = process.env.TEST_USER_PASS
let testContributorName = process.env.TEST_CONTRIBUTOR_NAME
let testContributorPass = process.env.TEST_CONTRIBUTOR_PASS


Feature('Cleanup Linked Repos')

Scenario('cleanup CLA assistant', (I) => {
    cla.removeLinkedRepo(I, testUserName, 'repo1')
    cla.removeLinkedRepo(I, testUserName, 'repo2')
})

Scenario('cleanup Github', (I) => {
    session('owner', () => {
        github.login(I, testUserName, testUserPass)
        github.deleteRepo(I, testUserName, 'repo1')
        github.deleteRepo(I, testUserName, 'repo2')
        github.revokePermissions(I)
    })

    session('contributor', () => {
        github.login(I, testContributorName, testContributorPass)
        github.deleteRepo(I, testContributorName, 'repo1')
        github.deleteRepo(I, testContributorName, 'repo2')
        github.revokePermissions(I)
    })
})