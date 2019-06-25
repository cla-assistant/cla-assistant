const url = require('url')

module.exports = function () {
    let baseUrl = url.format({
        protocol: config.server.http.protocol,
        hostname: config.server.http.host,
        port: config.server.http.port
    });

    let githubBase = url.format({
        protocol: config.server.github.protocol,
        host: config.server.github.host
    });

    let githubApiBase = url.format({
        protocol: config.server.github.protocol,
        host: config.server.github.api
    });

    return {
        // socket: localSocket,
        baseUrl: baseUrl,
        baseWebhook: url.resolve(baseUrl, '/github/webhook/'),
        claURL: (user, repo, number) => {
            let claUrl = url.resolve(baseUrl, '/' + user + '/' + repo)
            claUrl = number ? claUrl + '?pullRequest=' + number : claUrl

            return claUrl
        },
        githubBase: githubBase,
        githubApiBase: githubApiBase,
        githubCallback: url.resolve(baseUrl, '/auth/github/callback'),
        githubAuthorization: url.resolve(githubBase, '/login/oauth/authorize'),
        githubToken: url.resolve(githubBase, '/login/oauth/access_token'),
        githubProfile: () => url.resolve(githubApiBase, config.server.github.enterprise ? '/api/v3/user' : '/user'),
        githubCommits: (owner, repo, sha, since) => {
            let _url = url.resolve(githubApiBase, `/repos/${owner}/${repo}/commits`)
            _url = sha ? `${_url}?sha=${sha}` : _url
            _url += sha && since ? '&' : since ? '?' : ''
            _url = since ? `${_url}since=${since}` : _url

            return _url
        },
        githubFileReference: (user, repo, fileReference) => url.resolve(githubBase, `/${user}/${repo}/blob/${fileReference}`),
        githubOrgWebhook: (org) => url.resolve(githubApiBase, `/orgs/${org}/hooks`),
        githubPullRequests: (owner, repo, state) => {
            let _url = `${module.exports.githubRepository(owner, repo)}/pulls`
            _url = state ? `${_url}?state=${state}` : _url

            return _url
        },
        githubPullRequest: (owner, repo, number) => url.resolve(githubApiBase, '/repos/' + owner + '/' + repo + '/pulls/' + number),
        githubPullRequestCommits: (owner, repo, number) => {
            return module.exports.githubPullRequest(owner, repo, number) + '/commits'
        },
        githubPullRequestComments: (owner, repo, number) => url.resolve(githubApiBase, `/repos/${owner}/${repo}/issues/${number}/comments`),
        githubRepository: (owner, repo) => {
            let _url = url.resolve(githubApiBase, `/repos/${owner}/${repo}`)

            return _url
        },
        pullRequestBadge: (signed) => {
            let signed_str = signed ? 'signed' : 'not_signed'
            return url.resolve(baseUrl, `/pull/badge/${signed_str}`)
        },
        recheckPrUrl: (owner, repo, number) => {
            let checkUrl = url.resolve(baseUrl, `/check/${owner}/${repo}`)
            checkUrl = number ? `${checkUrl}?pullRequest=${number}` : checkUrl

            return checkUrl
        },
        webhook: (repo) => url.resolve(baseUrl, `/github/webhook/${repo}`)
    }
}()