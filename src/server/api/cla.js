// modules
let async = require('async');
let q = require('q');
let Joi = require('joi');

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
    let metadata = files && files.metadata ? files.metadata.content : undefined;

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
            log.error(new Error(error).stack);
        }
        orgService.getOrgWithSharedGist(gist, function (err, orgs) {
            if (err) {
                log.error(new Error(err).stack);
            }
            done(null, {
                repos: repos,
                orgs: orgs
            });
        });
    });
}

async function validatePullRequest(args, done) {
    args.token = args.token ? args.token : token;
    try {
        const item = await cla.getLinkedItem(args);
        args.token = item.token;
        if (!item.gist) {
            return status.updateForNullCla(args, function () {
                prService.deleteComment({
                    repo: args.repo,
                    owner: args.owner,
                    number: args.number
                }, done);
            });
        }
        const isClaRequired = await cla.isClaRequired(args);
        if (!isClaRequired) {
            return status.updateForClaNotRequired(args, function () {
                prService.deleteComment({
                    repo: args.repo,
                    owner: args.owner,
                    number: args.number
                }, done);
            });
        }
        cla.check(args, function (cla_err, all_signed, user_map) {
            if (cla_err) {
                log.error(cla_err.stack);
            }
            args.signed = all_signed;
            var update_method = 'updateForClaNotRequired';
            if (!user_map ||
                (user_map.signed && user_map.signed.length > 0) ||
                (user_map.not_signed && user_map.not_signed.length > 0) ||
                (user_map.unknown && user_map.unknown.length > 0)
            ) {
                update_method = 'update';
            }

            return status[update_method](args, function () {
                prService.editComment({
                    repo: args.repo,
                    owner: args.owner,
                    number: args.number,
                    signed: args.signed,
                    user_map: user_map
                }, done);
            });
        });
    } catch (e) {
        let logArgs = Object.assign({}, args);
        logArgs.token = logArgs.token ? logArgs.token.slice(0, 4) + '***' : undefined;
        log.error(e.stack, logArgs);
        done();
        throw e;
    }
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
async function updateUsersPullRequests(args) {
    function validateUserPRs(repo, owner, gist, sharedGist, numbers, token) {
        numbers.forEach((prNumber) => {
            validatePullRequest({
                repo: repo,
                owner: owner,
                number: prNumber,
                gist: gist,
                sharedGist: sharedGist,
                token: token
            }, function () { /*do nothing*/ });
        });
    }

    function prepareForValidation(item, user) {
        const needRemove = [];

        return Promise.all(user.requests.map(async (pullRequests, index) => {
            try {
                const linkedItem = await cla.getLinkedItem({ repo: pullRequests.repo, owner: pullRequests.owner });
                if (!linkedItem) {
                    needRemove.push(index);

                    return;
                }
                if ((linkedItem.owner === item.owner && linkedItem.repo === item.repo) || linkedItem.org === item.org || (linkedItem.gist === item.gist && item.sharedGist === true && linkedItem.sharedGist === true)) {
                    needRemove.push(index);
                    validateUserPRs(pullRequests.repo, pullRequests.owner, linkedItem.gist, linkedItem.sharedGist, pullRequests.numbers, linkedItem.token);
                }

                return linkedItem;
            } catch (e) {
                log.warn(e.stack);
            }
        }).filter((promise) => {
            return promise !== undefined;
        })).then(() => {
            needRemove.sort();
            for (let i = needRemove.length - 1; i >= 0; --i) {
                user.requests.splice(needRemove[i], 1);
            }
            user.save();
        });
    }

    try {
        const user = await User.findOne({ name: args.user });
        if (!user || !user.requests || user.requests.length < 1) {
            throw 'user or PRs not found';
        }

        return prepareForValidation(args.item, user);
    } catch (e) {
        let req = {
            args: {
                gist: args.item.gist,
                token: args.token
            }
        };
        if (args.item.sharedGist) {
            return ClaApi.validateSharedGistItems(req, () => {
                // Ignore result
            });
        } else if (args.item.org) {
            req.args.org = args.item.org;

            return ClaApi.validateOrgPullRequests(req, () => {
                // Ignore result
            });
        }

        req.args.repo = args.repo;
        req.args.owner = args.owner;

        return ClaApi.validatePullRequests(req, () => {
            // Ignore result
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
                let linkedRepoSet = new Set(
                    linkedRepos
                        .filter(repo => repo.repoId)
                        .map(linkedRepo => linkedRepo.repoId.toString())
                );
                repos = allRepos.filter(repo => {
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
        let schema = Joi.object().keys({
            gist: Joi.alternatives([Joi.string().uri(), Joi.object().keys({ gist_url: Joi.string().uri(), gist_version: Joi.strict() })]),
            repoId: Joi.number(),
            orgId: Joi.number(),
            repo: Joi.string(),
            owner: Joi.string()
        });
        Joi.validate(req.args, schema, { abortEarly: false }, function (joiErr) {
            if (joiErr) {
                joiErr.code = 400;

                return done(joiErr);
            }
            if (req.user && req.user.token && req.args.gist) {
                cla.getGist({
                    token: req.user.token,
                    gist: req.args.gist
                }, done);
            } else {
                let service = req.args.orgId ? orgService : repoService;
                service.get(req.args, function (err, item) {
                    if (err || !item) {
                        log.warn(err.stack + 'with args: ' + req.args);
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
        });
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
        args.userId = req.user.id;
        cla.getLastSignature(args, done);
    },

    //Fihnd linked item using reponame and owner as parameters
    // Params:
    // repo (mandatory)
    // owner (mandatory)
    getLinkedItem: function (req) {
        return cla.getLinkedItem(req.args);
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

        function getMissingParams() {
            return new Promise(async function (resolve, reject) {
                if (params.gist && params.gist.gist_url && params.gist.gist_version && (params.repoId || params.orgId)) {
                    throw 'invalid parameters provided';
                } else {
                    try {
                        const item = await self.getLinkedItem(req);
                        if (!item) {
                            throw new Error('no item found');
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
                        cla.getGist(req.args, function (err, gist) {
                            if (!gist) {
                                let error = `No gist found ${err}`;
                                log.warn(new Error(error).stack, req.args);
                                reject(error);
                            } else {
                                params.gist.gist_version = gist.history[0].version;
                                resolve();
                            }
                        });
                    } catch (e) {
                        log.info(e, 'There is no such item for args: ', req.args);
                        throw `${e} There is no such item`;
                    }
                }
            });
        }

        function count() {
            cla.getAll(params, function (err, clas) {
                done(err, clas.length);
            });
        }
        getMissingParams().then(count, done);
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

        function doneIfNeed(err) {
            if (typeof done === 'function') {
                done(err);
            }
        }

        function validateData(err) {
            if (pullRequests.length > 0 && !err) {
                async.series(pullRequests.map(function (pullRequest) {
                    return function (callback) {
                        let status_args = {
                            repo: req.args.repo,
                            owner: req.args.owner,
                            sha: pullRequest.head.sha,
                            token: token
                        };
                        status_args.number = pullRequest.number;

                        self.validatePullRequest(status_args, callback);
                    };
                }), doneIfNeed);
            } else {
                doneIfNeed(null);
            }
        }

        function collectData(err, res) {
            if (err) {
                log.error(new Error(err).stack);
            }

            if (res && !err) {
                pullRequests = pullRequests.concat(res);
            }

            validateData(err);
        }

        github.call({
            obj: 'pullRequests',
            fun: 'getAll',
            arg: {
                owner: req.args.owner,
                repo: req.args.repo,
                state: 'open',
                per_page: 3
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
            }), done);
        });
    },

    sign: async function (req) {
        let args = {
            repo: req.args.repo,
            owner: req.args.owner,
            user: req.user.login,
            userId: req.user.id,
        };
        if (req.args.custom_fields) {
            args.custom_fields = req.args.custom_fields;
        }
        try {
            const item = await this.getLinkedItem({
                args: {
                    repo: args.repo,
                    owner: args.owner
                }
            });

            args.item = item;
            args.token = item.token;
            args.origin = `sign|${req.user.login}`;

            const signed = await cla.sign(args);
            await updateUsersPullRequests(args);

            return signed;
        } catch (e) {
            if (!e.code || e.code != 200) {
                log.error(new Error(e).stack);
            }
            throw e;
        }
    },

    check: function (req, done) {
        let args = {
            repo: req.args.repo,
            owner: req.args.owner,
            number: req.args.number,
            user: req.user.login,
            userId: req.user.id
        };

        cla.check(args, done);
    },

    upload: function (req, done) {
        const signatures = req.args.signatures || [];
        const uploadInitiator = req.user.login;

        async.each(signatures, function (signature, callback) {
            if (!signature || !signature.user) {
                // eslint-disable-next-line quotes
                var error = `Uploaded signature doesn't contain user name`;
                log.info(new Error(error).stack);
                callback(error);
            }
            github.call({
                obj: 'users',
                fun: 'getForUser',
                arg: {
                    username: signature.user
                },
                token: req.user.token
            }, async function (err, gh_user) {
                if (err || !gh_user) {
                    return callback();
                }

                const args = {
                    repo: req.args.repo,
                    owner: req.args.owner,
                    user: gh_user.login,
                    userId: gh_user.id,
                    origin: `upload|${uploadInitiator}`
                };
                if (signature.created_at) {
                    args.created_at = signature.created_at;
                }
                if (signature.custom_fields) {
                    args.custom_fields = signature.custom_fields;
                }

                try {
                    const signed = await cla.sign(args);
                    callback(null, signed);
                } catch (e) {
                    log.info(new Error(e).stack);
                    callback(e);
                }
            });
        }, done);
    },

    addSignature: function (req, done) {
        let self = this;
        let schema = Joi.object().keys({
            user: Joi.string().required(),
            userId: Joi.number().required(),
            org: Joi.string(),
            owner: Joi.string(),
            repo: Joi.string(),
            custom_fields: Joi.string(),
            origin: Joi.string(),
        }).and('repo', 'owner').xor('repo', 'org');
        Joi.validate(req.args, schema, { abortEarly: false, convert: false }, async function (joiErr) {
            if (joiErr) {
                joiErr.code = 400;

                return done(joiErr);
            }
            req.args.owner = req.args.owner || req.args.org;
            delete req.args.org;
            try {

                const item = await self.getLinkedItem({
                    args: {
                        repo: req.args.repo,
                        owner: req.args.owner
                    }
                });
                req.args.item = item;
                req.args.token = item.token;
                req.args.origin = `${req.args.origin ? req.args.origin + '|' : ''}addSignature|${req.user.login}`;
                const signed = await cla.sign(req.args);
                updateUsersPullRequests(req.args);
                // Add signature API will get a timeout error if waiting for validating pull requests.
                done(null, signed);
            } catch (e) {
                log.error(new Error(e).stack);

                return done(e);
            }
        });
    },

    hasSignature: function (req, done) {
        let argsScheme = Joi.object().keys({
            user: Joi.string().required(),
            userId: Joi.number().required(),
            org: Joi.string(),
            owner: Joi.string(),
            repo: Joi.string(),
            number: Joi.string()
        }).and('repo', 'owner').xor('repo', 'org');
        Joi.validate(req.args, argsScheme, { abortEarly: false, convert: false }, function (joiErr) {
            if (joiErr) {
                joiErr.code = 400;

                return done(joiErr);
            }
            req.args.owner = req.args.owner || req.args.org;
            delete req.args.org;
            cla.check(req.args, done);
        });
    },

    terminateSignature: function (req, done) {
        let schema = Joi.object().keys({
            user: Joi.string().required(),
            userId: Joi.number().required(),
            endDate: Joi.string().isoDate().required(),
            org: Joi.string(),
            owner: Joi.string(),
            repo: Joi.string(),
        }).and('repo', 'owner').xor('repo', 'org');
        Joi.validate(req.args, schema, { abortEarly: false, convert: false }, function (joiErr) {
            if (joiErr) {
                joiErr.code = 400;

                return done(joiErr);
            }
            req.args.owner = req.args.owner || req.args.org;
            delete req.args.org;
            cla.terminate(req.args, function (err, dbCla) {
                if (err) {
                    log.error(new Error(err).stack);

                    return done(err);
                }

                return done(null, dbCla);
            });
        });
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