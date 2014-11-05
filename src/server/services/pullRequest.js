var url = require('./url');
var github = require('./github');
var repoService = require('./repo');

module.exports = {
    badgeComment: function(owner, repo, repoId, pullNumber) {
        var badgeUrl = url.pullRequestBadge(repoId, pullNumber);
        var claUrl = url.claURL(owner, repo);
        var token;

        repoService.get({repo: repo, owner: owner}, function(err, res){
            if (res && !err) {
                token = res.token;
            }

            github.call({
                obj: 'issues',
                fun: 'createComment',
                arg: {
                    user: owner,
                    repo: repo,
                    number: pullNumber,
                    body: '[![claborate](' + badgeUrl + ')](' + claUrl + ')'
                },
                token: token
            }, function(err, res, meta){
                console.log(err);
                console.log(res);
            });
        });
    }
};
