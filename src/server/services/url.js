let url = require('url');

module.exports = function () {

    // var localSocket = url.format({
    //     protocol: 'http',
    //     hostname: 'localhost',
    //     port: config.server.localport
    // });

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
        claURL: function (user, repo, number) {
            let claUrl = url.resolve(baseUrl, '/' + user + '/' + repo);
            claUrl = number ? claUrl + '?pullRequest=' + number : claUrl;

            return claUrl;
        },
        githubBase: githubBase,
        githubApiBase: githubApiBase,
        githubCallback: url.resolve(baseUrl, '/auth/github/callback'),
        githubAuthorization: url.resolve(githubBase, '/login/oauth/authorize'),
        githubToken: url.resolve(githubBase, '/login/oauth/access_token'),
        githubProfile: function () {
            return url.resolve(githubApiBase, config.server.github.enterprise ? '/api/v3/user' : '/user');
        },
        githubCommits: function (owner, repo, sha, since) {
            let _url = url.resolve(githubApiBase, '/repos/' + owner + '/' + repo + '/commits');
            _url = sha ? _url + '?sha=' + sha : _url;
            _url += sha && since ? '&' : since ? '?' : '';
            _url = since ? _url + 'since=' + since : _url;

            return _url;
        },
        githubFileReference: function (user, repo, fileReference) {
            return url.resolve(githubBase, '/' + user + '/' + repo + '/blob/' + fileReference);
        },
        githubOrgWebhook: function (org) {
            return url.resolve(githubApiBase, '/orgs/' + org + '/hooks');
        },
        githubPullRequests: function (owner, repo, state) {
            let _url = this.githubRepository(owner, repo) + '/pulls';
            _url = state ? _url + '?state=' + state : _url;

            return _url;
        },
        githubPullRequest: function (owner, repo, number) {
            return url.resolve(githubApiBase, '/repos/' + owner + '/' + repo + '/pulls/' + number);
        },
        githubPullRequestCommits: function (owner, repo, number) {
            return this.githubPullRequest(owner, repo, number) + '/commits';
        },
        githubPullRequestComments: function (owner, repo, number) {
            return url.resolve(githubApiBase, '/repos/' + owner + '/' + repo + '/issues/' + number + '/comments');
        },
        githubRepository: function (owner, repo) {
            let _url = url.resolve(githubApiBase, '/repos/' + owner + '/' + repo);

            return _url;
        },
        pullRequestBadge: function (signed) {
            let signed_str = signed ? 'signed' : 'not_signed';

            return url.resolve(baseUrl, '/pull/badge/' + signed_str);
        },
        recheckPrUrl: function (owner, repo, number) {
            let checkUrl = url.resolve(baseUrl, '/check/' + owner + '/' + repo);
            checkUrl = number ? checkUrl + '?pullRequest=' + number : checkUrl;

            return checkUrl;
        },
        webhook: function (owner, repo) {
            return config.server.feature_flag.external_queue_url || url.resolve(baseUrl, '/github/webhook/' + owner || repo);
        }
    };
}();
