// modules
var async = require('async');
var q = require('q');

// services
var github = require('../services/github');
var cla = require('../services/cla');
var status = require('../services/status');
var repoService = require('../services/repo');
var orgService = require('../services/org');
var prService = require('../services/pullRequest');
var log = require('../services/logger');

var token;

function markdownRender (content, token) {
    var deferred = q.defer();
    var args = {
        obj: 'misc',
        fun: 'renderMarkdown',
        arg: {
            text: content
        },
        token: token
    };

    github.call(args, function (error, response) {
        var callback_error;
        if (!response || response.statusCode !== 200) {
            callback_error = response && response.message ? response.message : error;
            if (callback_error) {
                deferred.reject(callback_error);
                return;
            }
        }
        if (response) {
            deferred.resolve({
                raw: response.body || response.data || response
            });
        } else {
            deferred.reject(callback_error);
        }

    });
    return deferred.promise;
}

function renderFiles (files, renderToken) {
    var deferred = q.defer();
    try {
        var content;
        Object.keys(files).some(function (name) {
            content = name != 'metadata' ? files[name].content : content;
            return name != 'metadata';
        });
    } catch (e) {
        deferred.reject(e);
        return deferred.promise;
    }
    var metadata = files && files['metadata'] ? files['metadata'].content : undefined;

    var gistContent = {}, contentPromise, metaPromise;
    contentPromise = markdownRender(content, renderToken).then(function (data) {
        return data.raw;
    });
    if (metadata) {
        metaPromise = markdownRender(metadata, renderToken).then(function (data) {
            return data.raw;
        });
    }
    q.all([contentPromise, metaPromise]).then(function (data) {
        gistContent.raw = data[0];
        gistContent.meta = data[1];
        deferred.resolve(gistContent);
    },
        function (msg) {
            deferred.reject(msg);
        });
    return deferred.promise;
}

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
            done('Please, provide owner and repo name or orgId');
            return;
        }
        this.getGist(req, function (err, res) {
            if (err || !res) {
                log.error(new Error(err).stack, 'with args: ', req.args);
                done(err);
                return;
            }

            var renderToken = token ? token : req.user && req.user.token ? req.user.token : token;
            renderFiles(res.files, renderToken).then(
                function success (gistContent) {
                    done(null, gistContent);
                },
                function error(msg) {
                    log.warn(new Error(msg).stack, ' Args: ', req.args);
                    done(msg);
                }
            );
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
        var args = req.args;
        args.user = req.user.login;
        cla.getLastSignature(args, done);
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
        var self = this;
        function getMissingParams(cb) {
            if (params.gist && params.gist.gist_url && params.gist.gist_version && (params.repoId || params.orgId)) {
                cb();
            } else {
                self.getLinkedItem(req, function (err, item) {
                    if (err || !item) {
                        cb(err + ' There is no such item');
                        log.info(err, 'There is no such item for args: ', req.args);
                        return;
                    }
                    params.token = item.token;
                    if (item.orgId) {
                        params.orgId = item.orgId;
                    } else if (item.repoId) {
                        params.repoId = item.repoId;
                    }
                    params.gist = params.gist && params.gist.gist_url ? params.gist : {
                        gist_url: item.gist
                    };
                    cla.getGist(req.args, function (e, gist) {
                        params.gist.gist_version = gist.history[0].version;
                        cb();
                    });
                });
            }
        }
        function count(err) {
            if (err) {
                done(err);
                return;
            }
            cla.getAll(params, function (err, clas) {
                done(err, clas.length);
            });
        }
        getMissingParams(count);
    },

    validateOrgPullRequests: function (req, done) {
        var self = this;
        github.call({
            obj: 'repos',
            fun: 'getForOrg',
            arg: {
                org: req.args.org,
                per_page: 100
            },
            token: req.args.token || req.user.token
        }, function (err, repos) {
            orgService.get(req.args, function (err, linkedOrg) {
                if (repos && !repos.message && repos.length > 0) {
                    repos
                        .filter(function (repo) { return (linkedOrg.isRepoExcluded === undefined) || !linkedOrg.isRepoExcluded(repo.name); })
                        .forEach(function (repo) {
                            var validateRequest = {
                                args: {
                                    owner: repo.owner.login,
                                    repo: repo.name,
                                    token: req.args.token || req.user.token
                                },
                                user: req.user
                            };
                            self.validatePullRequests(validateRequest);
                        });
                }
                if (typeof done === 'function') {
                    done(repos.message || err, true);
                }
            });
        });
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
    },

    sign: function (req, done) {
        var args = {
            repo: req.args.repo,
            owner: req.args.owner,
            user: req.user.login,
            userId: req.user.id,
        };
        if (req.args.custom_fields) {
            args.custom_fields = req.args.custom_fields;
        }
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
                if (item.org) {
                    req.args.org = item.org;
                    self.validateOrgPullRequests(req);
                } else {
                    self.validatePullRequests(req);
                }
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
    //     // repoService.updateDBData(req, function(){
    //         cla.updateDBData(req, function(msg){
    //             done(null, msg);
    //         });
    //     // });
    // }
};
