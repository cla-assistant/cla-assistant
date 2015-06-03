var url = require('./url');
var github = require('./github');
var repoService = require('./repo');
var log = require('../services/logger');

var commitText = function(signed, badgeUrl, claUrl, user_map){
    if (signed) {
        return '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers have accepted the CLA.';
    }

    var text = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers of the pull request should sign our Contributor License Agreement in order to get your pull request merged.<br/>';
    if (user_map && user_map.not_signed) {
        text += '**' + user_map.signed.length + '** out of **' + (user_map.signed.length + user_map.not_signed.length) + '** committers have signed the CLA.<br/>';
        user_map.signed.forEach(function(signee){
            text += '<br/>:white_check_mark: ' + signee;
        });
        user_map.not_signed.forEach(function(signee){
            text += '<br/>:x: ' + signee;
        });
    }
    return text;
};

module.exports = {
    badgeComment: function(owner, repo, repoId, pullNumber, signed, user_map) {
        var badgeUrl = url.pullRequestBadge(signed);
        var token;

        this.getComment({repo: repo, owner: owner, number: pullNumber}, function(error, comment){
            repoService.get({repo: repo, owner: owner}, function(err, res){
                if (res && !err) {
                    token = res.token;
                }
                var claUrl = url.claURL(owner, repo, pullNumber);

                var body = commitText(signed, badgeUrl, claUrl, user_map);

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

            var user_map = args.user_map ? args.user_map : null;
            var body = commitText(args.signed, badgeUrl, claUrl, user_map);

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
