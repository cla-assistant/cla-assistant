var url = require('./url');
var github = require('./github');
var repoService = require('./repo');
var log = require('../services/logger');


module.exports = {
    badgeComment: function(owner, repo, repoId, pullNumber, signed) {
        var badgeUrl = url.pullRequestBadge(signed);
        var token;

        this.getComment({repo: repo, owner: owner, number: pullNumber}, function(error, comment){
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
                        basicAuth: {
                            user: config.server.github.user,
                            pass: config.server.github.pass
                        }
                    }, function(e, result, meta){
                        if (e) {
                            log.error(e);
                        }
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
                        basicAuth: {
                            user: config.server.github.user,
                            pass: config.server.github.pass
                        }
                    }, function(e, result, meta){
                        if (e) {
                            log.error(e);
                        }
                    });
                }
            });
        });
    },

    getComment: function(args, done){
        args.url = url.githubPullRequestComments(args.owner, args.repo, args.number);

        repoService.get({repo: args.repo, owner: args.owner}, function(err, result){
            if (result && !err) {
                args.token = result.token;
            }
            github.direct_call(args, function(e, res){
                if(!e && res && res.data && !res.data.message) {
                    var CLAAssistantComment;
                    res.data.some(function(comment){
                        if (comment.body.match(/.*!\[CLA assistant check\].*/)) {
                            CLAAssistantComment = comment;
                            return true;
                        }
                    });
                }
                done(e || res.data.message, CLAAssistantComment);
            });
        });
    },

    editComment: function(args, done){
        var commentToEdit;
        var badgeUrl = url.pullRequestBadge(args.signed);
        var claUrl = url.claURL(args.owner, args.repo, args.number);
        var token;
        this.getComment({repo: args.repo, owner: args.owner, number: args.number}, function(error, comment){
            if (error || !comment) {
                return;
            }

            var body = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers of the pull request should sign our Contributor License Agreement in order to get your pull request merged.';
            if (args.signed) {
                body = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers have accepted the CLA.';
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
                basicAuth: {
                    user: config.server.github.user,
                    pass: config.server.github.pass
                }
            }, function(e, result, meta){
                if (e) {
                    log.error(e);
                }
            });
        });
        done();
    }
};
