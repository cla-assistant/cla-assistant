var url = require('./url');
var github = require('./github');
var repoService = require('./repo');

module.exports = {
    badgeComment: function(owner, repo, repoId, pullNumber, signed) {
        var badgeUrl = url.pullRequestBadge(signed);
        var token;

        this.getComment({repo: repo, owner: owner, number: pullNumber}, function(err, comment){
            repoService.get({repo: repo, owner: owner}, function(err, res){
                if (res && !err) {
                    token = res.token;
                }
                var claUrl = url.claURL(owner, repo, pullNumber);

                var body = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers of the pull request should sign our Contributor License Agreement in order to get your pull request merged.';
                if (signed) {
                    body = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers have accepted the CLA.';
                }
                if (!comment) {
                    github.call({
                        obj: 'issues',
                        fun: 'createComment',
                        arg: {
                            user: owner,
                            repo: repo,
                            number: pullNumber,
                            body: body
                        },
                        token: token
                    }, function(err, res, meta){
                        console.log(err);
                    });
                } else {
                    github.call({
                        obj: 'issues',
                        fun: 'editComment',
                        arg: {
                            user: owner,
                            repo: repo,
                            id: comment.id,
                            body: body
                        },
                        token: token
                    }, function(err, res, meta){
                        console.log(err);
                    });
                }
            });
        });
    },

    getComment: function(args, done){
        args.url = url.githubPullRequestComments(args.owner, args.repo, args.number);

        repoService.get({repo: args.repo, owner: args.owner}, function(err, res){
            if (res && !err) {
                args.token = res.token;
            }
            github.direct_call(args, function(err, res){
                if(!err && res && res.data && !res.data.message) {
                    var CLAAssistantComment;
                    res.data.some(function(comment){
                        if (comment.body.match(/.*!\[CLA assistant check\].*/)) {
                            CLAAssistantComment = comment;
                            return true;
                        }
                    });
                }
                done(err || res.data.message, CLAAssistantComment);
            });
        });
    },

    editComment: function(args, done){
        var commentToEdit;
        var badgeUrl = url.pullRequestBadge(args.signed);
        var claUrl = url.claURL(args.owner, args.repo, args.number);
        var token;
        this.getComment({repo: args.repo, owner: args.owner, number: args.number}, function(err, comment){
            if (err || !comment) {
                return;
            }

            repoService.get({repo: args.repo, owner: args.owner}, function(err, res){
                if (res && !err) {
                    token = res.token;
                }
                var body = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers of the pull request should sign our Contributor License Agreement in order to get your pull request merged.';
                if (args.signed) {
                    body = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers has accepted the CLA.';
                }

                github.call({
                    obj: 'issues',
                    fun: 'editComment',
                    arg: {
                        user: args.owner,
                        repo: args.repo,
                        id: comment.id,
                        body: body
                    },
                    token: token
                }, function(err, res, meta){
                    console.log(err);
                });
            });
        });
        done();
    }
};
