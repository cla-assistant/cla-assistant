// modules
let async = require('async');
let q = require('q');
require('../documents/user');

// services
let github = require('../services/github');
let cla = require('../services/cla');
let status = require('../services/status');
let repoService = require('../services/repo');
let orgService = require('../services/org');
let prService = require('../services/pullRequest');
let log = require('../services/logger');

let config = require('../../config');
let User = require('mongoose').model('User');

let token;

function markdownRender(content, token) {
    let deferred = q.defer();
    let args = {
        obj: 'misc',
        fun: 'renderMarkdown',
        arg: {
            text: content
        },
        token: token
    };

    github.call(args, function (error, response) {
        let callback_error;
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

function renderFiles(files, renderToken) {
    let deferred = q.defer();
    let content;
    try {
        Object.keys(files).some(function (name) {
            content = name != 'metadata' ? files[name].content : content;
            return name != 'metadata';
        });
    } catch (e) {
        deferred.reject(e);
        return deferred.promise;
    }
    let metadata = files && files['metadata'] ? files['metadata'].content : undefined;

    let gistContent = {};
    let contentPromise;
    let metaPromise;
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

function getLinkedItemsWithSharedGist(gist, done) {
    if (!gist) {
        return done('Gist is required.');
    }
    repoService.getRepoWithSharedGist(gist, function (error, repos) {
        if (error) {
            log.error(error);
        }
        orgService.getOrgWithSharedGist(gist, function (err, orgs) {
            if (err) {
                log.error(err);
            }
            done(null, {
                repos: repos,
                orgs: orgs
            });
        });
    });
}

function validatePullRequest(args, done) {
    args.token = args.token ? args.token : token;
    cla.check(args, function (cla_err, all_signed, user_map) {
        if (cla_err) {
            log.error(cla_err);
        }
        args.signed = all_signed;
        if (args.gist) {
            status.update(args);
            prService.editComment({
                repo: args.repo,
                owner: args.owner,
                number: args.number,
                signed: args.signed,
                user_map: user_map
            });
        } else {
            status.delete(args);
            prService.deleteComment({
                repo: args.repo,
                owner: args.owner,
                number: args.number
            });
        }
    });
}

// Check/update status and comment of PRs saved for the user and matching linked item
// Params:
// user (mandatory)
// repo (mandatory)
// owner (mandatory)
// item (mandatory)
//      gist (mandatory)
//      sharedGist (optional)
// token (mandatory)
function updateUsersPullRequests(args) {
    User.findOne({ name: args.user }, (err, user) => {
        if (err || !user || !user.requests || user.requests.length < 1) {
            let req = {
                args: {
                    repo: args.repo,
                    owner: args.owner,
                    gist: args.item.gist,
                    sharedGist: args.item.sharedGist,
                    token: args.token
                }
            };
            ClaApi.validatePullRequests(req, () => { });
            return;
        }
        prepareForValidation(args.item, user);
    });

    function prepareForValidation(item, user) {
        const needRemove = [];
        async.series(user.requests.map((pullRequests, index) => {
            return function (callback) {
                return cla.getLinkedItem({ repo: pullRequests.repo, owner: pullRequests.owner }, (err, linkedItem) => {
                    if (linkedItem && (linkedItem.owner === item.owner && linkedItem.repo === item.repo) || linkedItem.org === item.org || (linkedItem.gist === item.gist && item.sharedGist === true && linkedItem.sharedGist === true)) {
                        needRemove.push(index);
                        validateUserPRs(pullRequests.repo, pullRequests.owner, linkedItem.gist, linkedItem.sharedGist, pullRequests.numbers, linkedItem.token);
                    }
                    callback();
                });
            };
        }), () => {
            needRemove.sort();
            for (let i = needRemove.length - 1; i >= 0; --i) {
                user.requests.splice(needRemove[i], 1);
            }
            user.save();
        });
    }

    function validateUserPRs(repo, owner, gist, sharedGist, numbers, token) {
        numbers.forEach((prNumber) => {
            validatePullRequest({
                repo: repo,
                owner: owner,
                number: prNumber,
                gist: gist,
                sharedGist: sharedGist,
                token: token
            }, function () { });
        });
    }
}

function getReposNeedToValidate(req, done) {
    let repos = [];
    github.call({
        obj: 'repos',
        fun: 'getForOrg',
        arg: {
            org: req.args.org,
            per_page: 100
        },
        token: req.args.token || req.user.token
    }, function (error, allRepos) {
        if ((allRepos && allRepos.message) || error || (allRepos && allRepos.length === 0)) {
            return done((allRepos && allRepos.message) || error, repos);
        }
        orgService.get(req.args, function (err, linkedOrg) {
            if (err) {
                return done(err, repos);
            }
            repoService.getByOwner(req.args.org, function (er, linkedRepos) {
                if (er) {
                    return done(er, repos);
                }
                let linkedRepoSet = new Set(linkedRepos.map(function (linkedRepo) {
                    return linkedRepo.repoId.toString();
                }));
                repos = allRepos.filter(function (repo) {
                    if (linkedOrg.isRepoExcluded !== undefined && linkedOrg.isRepoExcluded(repo.name)) {
                        // The repo has been excluded.
                        return false;
                    }
                    if (linkedRepoSet.has(repo.id.toString())) {
                        // The repo has a separate CLA.
                        return false;
                    }
                    return true;
                });
                done(null, repos);
            });
        });
    });
}

let ClaApi = {
    getGist: function (req, done) {
        if (req.user && req.user.token && req.args.gist) {
            cla.getGist({
                token: req.user.token,
                gist: req.args.gist
            }, done);
        } else {
            let service = req.args.orgId ? orgService : repoService;
            service.get(req.args, function (err, item) {
                if (err || !item) {
                    log.warn(new Error(err).stack, 'with args: ', req.args);
                    done(err);
                    return;
                }
                let gist_args = {
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

    get: function (req, done) {
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

            let renderToken = token ? token : req.user && req.user.token ? req.user.token : token;
            renderFiles(res.files, renderToken).then(
                function success(gistContent) {
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
        let args = req.args;
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
        let params = req.args;
        let self = this;

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
                    params.sharedGist = item.sharedGist;
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
        let self = this;
        getReposNeedToValidate(req, function (error, repos) {
            let time = config.server.github.timeToWait;
            repos.forEach(function (repo, index) {
                let validateRequest = {
                    args: {
                        owner: repo.owner.login,
                        repo: repo.name,
                        token: req.args.token || req.user.token
                    },
                    user: req.user
                };
                //try to avoid rasing githubs abuse rate limit:
                //take 1 second per repo and wait 10 seconds after each 10th repo
                setTimeout(function () {
                    log.info('validateOrgPRs for ' + validateRequest.args.owner + '/' + validateRequest.args.repo);
                    self.validatePullRequests(validateRequest);
                }, time * (index + (Math.floor(index / 10) * 10)));
            });
            if (typeof done === 'function') {
                done(error, true);
            }
        });
    },

    // Check/update status and comment of PR
    // Params:
    // repo (mandatory)
    // owner (mandatory)
    // number (mandatory)
    // gist (optional)
    // sharedGist (optional)
    // token (optional)
    // sha (optional)
    validatePullRequest: function (args, done) {
        validatePullRequest(args, done);
    },

    validatePullRequests: function (req, done) {
        let self = this;
        let pullRequests = [];
        let token = req.args.token ? req.args.token : req.user.token;

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
                    let status_args = {
                        repo: req.args.repo,
                        owner: req.args.owner,
                        sha: pullRequest.head.sha,
                        gist: req.args.gist,
                        sharedGist: req.args.sharedGist,
                        token: token
                    };
                    status_args.number = pullRequest.number;

                    self.validatePullRequest(status_args);
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
                owner: req.args.owner,
                repo: req.args.repo,
                state: 'open',
                per_page: 100
            },
            token: token
        }, collectData);
    },

    validateSharedGistItems: function (req, done) {
        let self = this;
        getLinkedItemsWithSharedGist(req.args.gist, function (error, sharedItems) {
            if (error) {
                done(error);
            }
            let items = (sharedItems.repos || []).concat(sharedItems.orgs || []);
            async.series(items.map(function (item) {
                return function (callback) {
                    let tmpReq = {
                        args: {
                            token: item.token,
                            gist: item.gist,
                            sharedGist: true
                        }
                    };
                    if (item.org) {
                        tmpReq.args.org = item.org;
                        return self.validateOrgPullRequests(tmpReq, callback);
                    }
                    tmpReq.args.repo = item.repo;
                    tmpReq.args.owner = item.owner;
                    self.validatePullRequests(tmpReq, callback);
                };
            }), function (err) {
                done(err);
            });
        });
    },

    sign: function (req, done) {
        let args = {
            repo: req.args.repo,
            owner: req.args.owner,
            user: req.user.login,
            userId: req.user.id,
        };
        if (req.args.custom_fields) {
            args.custom_fields = req.args.custom_fields;
        }
        let self = this;

        self.getLinkedItem({
            args: {
                repo: args.repo,
                owner: args.owner
            }
        }, function (e, item) {
            if (e) {
                log.error(e);
            }
            args.item = item;
            args.token = item.token;
            cla.sign(args, function (err, signed) {
                if (err) {
                    log.error(err);
                }
                updateUsersPullRequests(args);
                done(err, signed);
            });
        });
    },

    check: function (req, done) {
        let args = {
            repo: req.args.repo,
            owner: req.args.owner,
            user: req.user.login
        };

        cla.check(args, done);
    },

    upload: function (req, done) {

        let users = req.args.users || [];

        async.each(users, function (user, callback) {
            github.call({
                obj: 'users',
                fun: 'getForUser',
                arg: {
                    username: user
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

module.exports = ClaApi;