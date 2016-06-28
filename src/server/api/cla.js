// modules
var async = require('async');

// services
var github = require('../services/github');
var cla = require('../services/cla');
var status = require('../services/status');
var repoService = require('../services/repo');
var orgService = require('../services/org');
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
            var service = req.args.orgId ? orgService : repoService;
            service.get(req.args, function (err, item) {
                if (err || !item) {
                    log.warn(new Error(err).stack, 'with args: ', req.args);
                    done(err);
                    return;
                }
                var gist_args = {
                    gist_url: item.gist
                };
                gist_args = req.args.gist ? req.args.gist : gist_args;
                token = item.token;
                cla.getGist({
                    token: token,
                    gist: gist_args
                }, done);
            });
        }
    },

    get: function(req, done) {
        if (!req.args || (!req.args.repo && !req.args.repoId && !req.args.orgId)) {
            log.info('args: ', req.args);
            log.info('request headers: ', req.headers);
            done('Please, provide owner and repo name');
            return;
        }
        this.getGist(req, function (err, res) {
            if (err || !res) {
                log.error(new Error(err).stack, 'with args: ', req.args);
                done(err);
                return;
            }
            try {
                var args = {
                    obj: 'misc',
                    fun: 'renderMarkdown',
                    arg: {
                        text: res.files[Object.keys(res.files)[0]].content
                    }
                };
            } catch (e) {
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
        repoService.get(req.args, function (err, repo) {
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

    //Fihnd linked item using reponame and owner as parameters
    // Params:
    // repo (mandatory)
    // owner (mandatory)
    getLinkedItem: function (req, done) {
        cla.getLinkedItem(req.args, done);
    },

    //Get all signed CLAs for given repo and gist url and/or a given gist version
    //Params:
    //	repo (mandatory)
    //	owner (mandatory)
    //	gist.gist_url (mandatory)
    //	gist.gist_version (optional)
    getAll: function (req, done) {
        cla.getAll(req.args, done);
    },

    //Get number of signed CLAs for the given repo. If no gist_version provided, the latest one will be used.
    //Params:
    //	repo (mandatory)
    //	owner (mandatory)
    //	gist.gist_url (optional)
    //	gist.gist_version (optional)
    countCLA: function (req, done) {
        var params = req.args;
        function getMissingParams(cb) {
            if (params.gist && params.gist.gist_url && params.gist.gist_version) {
                cb();
            } else {
                repoService.get(req.args, function (err, repo) {
                    if (err || !repo) {
                        cb();
                    }
                    params.token = repo.token;
                    params.gist = params.gist && params.gist.gist_url ? params.gist : {
                        gist_url: repo.gist
                    };
                    cla.getGist(req.args, function (e, gist) {
                        params.gist.gist_version = gist.history[0].version;
                        cb();
                    });
                });
            }
        }
        function count() {
            cla.getAll(params, function (err, clas) {
                done(err, clas.length);
            });
        }
        getMissingParams(count);
    },

    validatePullRequests: function (req, done) {
        var pullRequests = [];
        var token = req.args.token ? req.args.token : req.user.token;
        function collectData(err, res, meta) {
            if (err) {
                log.error(err);
            }

            if (res && !err) {
                pullRequests = pullRequests.concat(res);
            }

            if (meta && meta.link && github.hasNextPage(meta.link)) {
                github.getNextPage(meta.link, collectData);
            } else {
                validateData(err);
            }
        }
        function validateData(err) {
            if (pullRequests.length > 0 && !err) {
                pullRequests.forEach(function (pullRequest) {
                    var status_args = {
                        repo: req.args.repo,
                        owner: req.args.owner,
                        token: token
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
                done(err);
            }
        }

        github.call({
            obj: 'pullRequests',
            fun: 'getAll',
            arg: {
                user: req.args.owner,
                repo: req.args.repo,
                state: 'open',
                per_page: 100
            },
            token: token
        }, collectData);

        // github.direct_call({
        //     url: url.githubPullRequests(req.args.owner, req.args.repo, 'open'),
        //     token: req.args.token ? req.args.token : req.user.token
        // }, function (error, res) {
        //     if (error) {
        //         log.error(error);
        //     }

        //     if (res && res.data && !error) {
        //         res.data.forEach(function (pullRequest) {
        //             var status_args = {
        //                 repo: req.args.repo,
        //                 owner: req.args.owner
        //             };
        //             status_args.number = pullRequest.number;
        //             cla.check(status_args, function (cla_err, all_signed, user_map) {
        //                 if (cla_err) {
        //                     log.error(cla_err);
        //                 }
        //                 status_args.signed = all_signed;
        //                 status.update(status_args);
        //                 prService.editComment({
        //                     repo: req.args.repo,
        //                     owner: req.args.owner,
        //                     number: status_args.number,
        //                     signed: all_signed,
        //                     user_map: user_map
        //                 });
        //             });
        //         });
        //     }
        //     if (typeof done === 'function') {
        //         done(error);
        //     }
        // });
    },

    sign: function (req, done) {
        var args = {
            repo: req.args.repo,
            owner: req.args.owner,
            user: req.user.login,
            userId: req.user.id
        };
        var self = this;

        cla.sign(args, function (err, signed) {
            if (err) {
                log.error(err);
            }
            self.getLinkedItem({
                args: {
                    repo: args.repo,
                    owner: args.owner
                }
            }, function (e, item) {
                if (e) {
                    log.error(e);
                }
                req.args.token = item.token;
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
                obj: 'users',
                fun: 'getForUser',
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
                    userId: gh_user.id
                }, callback);
            });
        }, done);
    }

    // updateDBData: function (req, done) {
    //     repoService.updateDBData(req, function(){
    //         cla.updateDBData(req, function(msg){
    //             done(null, msg);
    //         });
    //     });
    // }
};
