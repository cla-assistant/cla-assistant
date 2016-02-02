// modules
var async = require('async');

// services
var github = require('../services/github');
var cla = require('../services/cla');
var status = require('../services/status');
var repoService = require('../services/repo');
var url = require('../services/url');
var prService = require('../services/pullRequest');
var log = require('../services/logger');

var token;

module.exports = {
    getGist: function (req, done) {
        if (req.user && req.user.token && req.args.gist) {
            cla.getGist({
                token: req.user.token,
                gist: req.args.gist
            }, done);
        } else {
            cla.getRepo(req.args, function (err, repo) {
                if (err || !repo) {
                    log.warn(err);
                    done(err);
                    return;
                }
                var gist_args = {
                    gist_url: repo.gist
                };
                gist_args = req.args.gist ? req.args.gist : gist_args;
                token = req.user && req.user.token ? req.user.token : repo.token;
                cla.getGist({
                    token: token,
                    gist: gist_args
                }, done);
            });
        }
    },

    get: function (req, done) {
        this.getGist(req, function (err, res) {
            if (err || !res) {
                log.error(err);
                done(err);
                return;
            }
            try {
                var args = {
                    obj: 'markdown',
                    fun: 'render',
                    arg: {
                        text: res.files[Object.keys(res.files)[0]].content
                    }
                };
            } catch (e){
                log.warn(e, ' Args: ', req.args);
                done(e);
                return;
            }

            args.token = req.user && req.user.token ? req.user.token : token;

            github.call(args, function (error, response) {
                var callback_error;
                if (!response || response.statusCode !== 200) {
                    callback_error = response && response.message ? response.message : error;
                    if (callback_error) {
                        log.error(callback_error);
                    }
                }
                if (response) {
                    done(callback_error, {
                        raw: response.body || response.data || response
                    });
                } else {
                    done(callback_error);
                }

            });
        });
    },


    //Get list of signed CLAs for all repos the authenticated user has contributed to
    //Prameters: none (user should be taken)
    getSignedCLA: function (req, done) {
        cla.getSignedCLA(req.args, done);
    },

    //Get users last signature for given repository (if repo is currently linked)
    //Parameters: repo, owner (mandatory)
    getLastSignature: function (req, done) {
        cla.getRepo(req.args, function (err, repo) {
            if (err || !repo) {
                log.warn(err);
                done(err);
                return;
            }
            var args = {
                repo: req.args.repo,
                owner: req.args.owner,
                user: req.user.login,
                gist_url: repo.gist
            };

            cla.getLastSignature(args, done);
        });
    },

    getAll: function (req, done) {
        cla.getAll(req.args, done);
    },

    validatePullRequests: function (req, done){
        github.direct_call({
            url: url.githubPullRequests(req.args.owner, req.args.repo, 'open'),
            token: req.args.token ? req.args.token : req.user.token
        }, function (error, res) {
            if (error) {
                log.error(error);
            }

            if (res && res.data && !error) {
                res.data.forEach(function (pullRequest) {
                    var status_args = {
                        repo: req.args.repo,
                        owner: req.args.owner
                    };
                    status_args.number = pullRequest.number;
                    cla.check(status_args, function (cla_err, all_signed, user_map) {
                        if (cla_err) {
                            log.error(cla_err);
                        }
                        status_args.signed = all_signed;
                        status.update(status_args);
                        prService.editComment({
                            repo: req.args.repo,
                            owner: req.args.owner,
                            number: status_args.number,
                            signed: all_signed,
                            user_map: user_map
                        });
                    });
                });
            }
            if (typeof done === 'function') {
                done(error);
            }
        });
    },

    sign: function (req, done) {
        var args = {
            repo: req.args.repo,
            owner: req.args.owner,
            user: req.user.login,
            user_id: req.user.id
        };
        var self = this;

        cla.sign(args, function (err, signed) {
            if (err) {
                log.error(err);
            }
            repoService.get({
                repo: args.repo,
                owner: args.owner
            }, function (e, repo) {
                if (e) {
                    log.error(e);
                }
                req.args.token = repo.token;
                self.validatePullRequests(req);
            });
            done(err, signed);
        });
    },

    check: function (req, done) {
        var args = {
            repo: req.args.repo,
            owner: req.args.owner,
            user: req.user.login
        };

        cla.check(args, done);
    },

    upload: function (req, done) {

        var users = req.args.users || [];

        async.each(users, function (user, callback) {
            github.call({
                obj: 'user',
                fun: 'getFrom',
                arg: {
                    user: user
                },
                token: req.user.token
            }, function (err, gh_user) {
                if (err || !gh_user) {
                    return callback();
                }
                cla.sign({
                    repo: req.args.repo,
                    owner: req.args.owner,
                    user: gh_user.login,
                    user_id: gh_user.id
                }, callback);
            });
        }, done);
    },

    updateDBData: function (req, done) {
        // cla.updateDBData(req, function(msg){
        // });
        repoService.updateDBData(req, function(){
        });
        done(null, 'Done.');
    }
};
