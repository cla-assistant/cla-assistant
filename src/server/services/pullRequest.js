var url = require('./url');
var github = require('./github');
var repoService = require('./repo');
var log = require('../services/logger');

var commitText = function(signed, badgeUrl, claUrl, user_map){
    if (signed) {
        return '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers have accepted the CLA.';
    }

    var text = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers of the pull request should sign our Contributor License Agreement in order to get your pull request merged.<br/>';
    var committersCount = 1;

    if (user_map && user_map.not_signed && user_map.signed) {
        committersCount = user_map.signed.length + user_map.not_signed.length;
    }

    if (committersCount > 1) {
        text += '**' + user_map.signed.length + '** out of **' + (user_map.signed.length + user_map.not_signed.length) + '** committers have signed the CLA.<br/>';
        user_map.signed.forEach(function(signee){
            text += '<br/>:white_check_mark: ' + signee;
        });
        user_map.not_signed.forEach(function(signee){
            text += '<br/>:x: ' + signee;
        });
    } else {
        text = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>You should sign our Contributor License Agreement in order to get your pull request merged.<br/>';
    }
    return text;
};

module.exports = {
    badgeComment: function(owner, repo, repoId, pullNumber, signed, user_map) {
        var badgeUrl = url.pullRequestBadge(signed);

        this.getComment({repo: repo, owner: owner, number: pullNumber}, function(error, comment){
            repoService.get({repo: repo, owner: owner}, function(err){
                if (err) {
                    log.info(err);
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
                    }, function(e){
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
                    }, function(e){
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
        var badgeUrl = url.pullRequestBadge(args.signed);
        var claUrl = url.claURL(args.owner, args.repo, args.number);
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
            }, function(e){
                if (e) {
                    log.error(e);
                }
            });
        });
        done();
    }
};
