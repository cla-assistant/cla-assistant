var url = require('url');

module.exports = function() {

    // var localSocket = url.format({
    //     protocol: 'http',
    //     hostname: 'localhost',
    //     port: config.server.localport
    // });

    var baseUrl = url.format({
        protocol: config.server.http.protocol,
        hostname: config.server.http.host,
        port: config.server.http.port
    });

    var githubBase = url.format({
        protocol: config.server.github.protocol,
        host: config.server.github.host
    });

    var githubApiBase = url.format({
        protocol: config.server.github.protocol,
        host: config.server.github.api
    });

    return {
        // socket: localSocket,
        baseUrl: baseUrl,
        baseWebhook: url.resolve(baseUrl, '/github/webhook/'),
        claURL: function(user, repo, number) {
            var claUrl = url.resolve(baseUrl, '/' + user + '/' + repo);
            claUrl = number ? claUrl + '?pullRequest=' + number : claUrl;
            return claUrl;
        },
        githubBase: githubBase,
        githubApiBase: githubApiBase,
        githubCallback: url.resolve(baseUrl, '/auth/github/callback'),
        githubAuthorization: url.resolve(githubBase, '/login/oauth/authorize'),
        githubToken: url.resolve(githubBase, '/login/oauth/access_token'),
        githubProfile: function() {
            return url.resolve(githubApiBase, config.server.github.enterprise ? '/api/v3/user' : '/user');
        },
        githubFileReference: function(user, repo, fileReference) {
            return url.resolve(githubBase, '/' + user + '/' + repo + '/blob/' + fileReference);
        },
        githubOrgWebhook: function(org) {
            return url.resolve(githubApiBase, '/orgs/' + org + '/hooks');
        },
        githubPullRequests: function(owner, repo, state){
            var _url = this.githubRepository(owner, repo) + '/pulls';
            _url = state ? _url + '?state=' + state : _url;
            return _url;
        },
        githubPullRequest: function(owner, repo, number){
            return url.resolve(githubApiBase, '/repos/' + owner + '/' + repo + '/pulls/' + number);
        },
        githubPullRequestCommits: function(owner, repo, number){
            return this.githubPullRequest(owner, repo, number) + '/commits';
        },
        githubPullRequestComments: function(owner, repo, number){
            return url.resolve(githubApiBase, '/repos/' + owner + '/' + repo + '/issues/' + number + '/comments');
        },
        githubRepository: function(owner, repo){
            var _url = url.resolve(githubApiBase, '/repos/' + owner + '/' + repo);
            return _url;
        },
        pullRequestBadge: function(signed) {
            var signed_str = signed ? 'signed' : 'not_signed';
            return url.resolve(baseUrl, '/pull/badge/' + signed_str);
        },
        webhook: function(repo) {
            return url.resolve(baseUrl, '/github/webhook/' + repo);
        },
    };
}();
