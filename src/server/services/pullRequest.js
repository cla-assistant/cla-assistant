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
                    body: '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>Please agree to our Contributor License Agreement in order to get your pull request merged.'
                },
                token: token
            }, function(err, res, meta){
                console.log(err);
            });
        });
    }
};
