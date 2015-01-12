
// //api
// var github_api = require('../api/github');

//services
var url = require('../services/url');
var github = require('../services/github');
var repoService = require('../services/repo');

module.exports = {
    update: function(args, done) {

        var status = 'pending';
        var description = 'Contributor License Agreement is not signed yet.';
        var token;

        repoService.get({repo: args.repo, owner: args.owner}, function(err, res){
            if (res && !err) {
                token = res.token;
            }
            args.url = url.githubPullRequest(args.owner, args.repo, args.number);
            args.token = token;

            github.direct_call(args, function(err, res){
                if (!err && res && res.data.head) {
                    args.sha = res.data.head.sha;

                    if (args.signed) {
                        status = 'success';
                        description = 'Contributor License Agreement is signed.';
                    }

                    github.call({
                        obj: 'statuses',
                        fun: 'create',
                        arg: {
                            user: args.owner,
                            repo: args.repo,
                            sha: args.sha,
                            state: status,
                            description: description,
                            target_url: url.claURL(args.owner, args.repo),
                            context: 'licence/cla'
                        },
                        token: token
                    }, null);
                }
            });
        });
    }
};
