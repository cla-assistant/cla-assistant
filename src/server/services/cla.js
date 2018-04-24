// models
require('../documents/cla');
let q = require('q');
let CLA = require('mongoose').model('CLA');

//services
let logger = require('../services/logger');
let orgService = require('../services/org');
let repoService = require('../services/repo');
let github = require('./github');
let config = require('../../config');
let _ = require('lodash');

module.exports = function () {
    let claService;

    let getGistObject = function (gist_url, token, done) {
        // let deferred = q.defer();
        let id = '';
        try {
            let gistArray = gist_url.split('/'); // e.g. https://gist.github.com/KharitonOff/60e9b5d7ce65ca474c29
            id = gistArray[gistArray.length - 1];
            id = id.match(/[\w\d]*/g)[0];
        } catch (ex) {
            done('The gist url "' + gist_url + '" seems to be invalid');

            return;
        }
        let args = {
            obj: 'gists',
            fun: 'get',
            arg: {
                id: id
            },
            token: token
        };

        return github.call(args, done);
    };

    let checkAll = function (users, repoId, orgId, sharedGist, gist_url, gist_version, onDates) {
        let deferred = q.defer();
        let all_signed = true;
        let promises = [];
        let user_map = {
            signed: [],
            not_signed: [],
            unknown: []
        };
        if (!users) {
            deferred.reject('There are no users to check :( ', users, repoId, orgId, sharedGist, gist_url, gist_version, onDates);

            return deferred.promise;
        }
        users.forEach(function (user) {
            user_map.not_signed.push(user.name);
            if (!user.id) {
                user_map.unknown.push(user.name);
            }
            promises.push(getLastSignatureOnMultiDates(user.name, user.id, repoId, orgId, sharedGist, gist_url, gist_version, onDates).then(function (cla) {
                if (!cla) {
                    all_signed = false;
                } else {
                    let i = user_map.not_signed.indexOf(cla.user);
                    if (i >= 0) {
                        user_map.not_signed.splice(i, 1);
                    }
                    user_map.signed.push(cla.user);
                }
            }));
        });
        q.all(promises).then(function () {
            deferred.resolve({
                signed: all_signed,
                user_map: user_map
            });
        });

        return deferred.promise;
    };

    let generateSharedGistQuery = function (gist_url, gist_version, user, userId) {
        let sharedGistCondition = {
            owner: undefined,
            repo: undefined,
            gist_url: gist_url,
        };
        if (gist_version) {
            sharedGistCondition.gist_version = gist_version;
        }
        if (userId) {
            sharedGistCondition.userId = userId;
        } else if (user) {
            sharedGistCondition.user = user;
        }

        return sharedGistCondition;
    };

    let generateDateConditions = function (onDates) {
        let dateConditions = [];
        if (!Array.isArray(onDates) || onDates.length === 0) {
            return dateConditions;
        }
        onDates.forEach(function (date) {
            dateConditions = dateConditions.concat([{
                created_at: { $lte: date },
                end_at: { $gt: date }
            }, {
                created_at: { $lte: date },
                end_at: undefined
            }]);
        });

        return dateConditions;
    };

    let updateQuery = function (query, sharedGist, onDates) {
        let queries = [query];
        if (query.userId) {
            let queryForOldCLAs = _.clone(query);
            queryForOldCLAs.userId = { $exists: false };
            queries.push(queryForOldCLAs);
            delete query.user;
        }
        if (sharedGist) {
            let shardGistQuery = generateSharedGistQuery(query.gist_url, query.gist_version, query.user, query.userId);
            queries.push(shardGistQuery);
        }
        let dateConditions = generateDateConditions(onDates);
        let newQuery = {
            $or: []
        };
        if (dateConditions.length === 0) {
            newQuery.$or = queries;

            return newQuery;
        }
        queries.forEach(function (query) {
            dateConditions.forEach(function (date) {
                newQuery.$or.push(Object.assign({}, query, date));
            });
        });

        return newQuery;
    };

    let getPR = function (owner, repo, number, token) {
        let deferred = q.defer();
        github.call({
            obj: 'pullRequests',
            fun: 'get',
            arg: {
                owner: owner,
                repo: repo,
                number: number
            },
            token: token
        }, function (error, pullRequest) {
            if (error) {
                return deferred.reject(error);
            }
            deferred.resolve(pullRequest);
        });

        return deferred.promise;
    };

    // let getOrg = function (args, done) {
    //     let deferred = q.defer();
    //     orgService.get(args, function (err, org) {
    //         if (!err && org) {
    //             deferred.resolve(org);
    //         } else {
    //             deferred.reject(err);
    //         }
    //         if (typeof done === 'function') {
    //             done(err, org);
    //         }
    //     });
    //     return deferred.promise;
    // };

    // let getRepo = function (args, done) {
    //     let deferred = q.defer();
    //     repoService.get(args, function (err, repo) {
    //         if (!err && repo) {
    //             deferred.resolve(repo);
    //         } else {
    //             deferred.reject(err);
    //         }
    //         if (typeof done === 'function') {
    //             done(err, repo);
    //         }
    //     });
    //     return deferred.promise;
    // };

    let getLinkedItem = function (repo, owner, token) {
        let deferred = q.defer();
        token = token || config.server.github.token;

        if (owner && !repo) {
            orgService.get({
                org: owner
            }, function (err, linkedOrg) {
                if (linkedOrg) {
                    deferred.resolve(linkedOrg);
                } else {
                    deferred.reject(err);
                }
            });
        } else {
            repoService.getGHRepo({
                owner: owner,
                repo: repo,
                token: token
            }, function (e, ghRepo) {
                if (e) {
                    // could not find the GH Repo
                    deferred.reject(e);
                } else {
                    repoService.get({
                        repoId: ghRepo.id
                    }, function (error, linkedRepo) {
                        if (linkedRepo) {
                            deferred.resolve(linkedRepo);
                        } else {
                            orgService.get({
                                orgId: ghRepo.owner.id
                            }, function (err, linkedOrg) {
                                if (linkedOrg) {
                                    deferred.resolve(linkedOrg);
                                } else {
                                    deferred.reject(error || err);
                                }
                            });
                        }
                    });
                }
            });
        }

        return deferred.promise;
    };

    let getLastSignatureOnMultiDates = function (user, userId, repoId, orgId, sharedGist, gist_url, gist_version, date) {
        let deferred = q.defer();
        sharedGist = sharedGist === undefined ? false : sharedGist;

        if (!user || (!repoId && !orgId) || !gist_url || (date && !Array.isArray(date))) {
            let msg = `Not provide enough arguments for getSignature() ${user} ${userId} ${repoId} ${orgId} ${sharedGist} ${gist_url} ${gist_version} ${date}`;
            let error = new Error(msg);
            logger.error(error);
            deferred.reject(error);
        }
        let query = {
            gist_url: gist_url,
            org_cla: !!orgId
        };
        if (repoId) {
            query.repoId = repoId;
        }
        if (orgId) {
            query.ownerId = orgId;
        }
        if (gist_version) {
            query.gist_version = gist_version;
        }
        if (userId) {
            query.userId = userId;
        } else {
            logger.info({ name: 'The userId is empty.', user: user, repoId: repoId, orgId: orgId });
        }
        query.user = user;

        query = updateQuery(query, sharedGist, date);
        CLA.findOne(query, {}, {
            sort: {
                'created_at': -1
            }
        }, function (error, cla) {
            if (error) {
                return deferred.reject(error);
            }
            if (cla && cla.user !== user) {
                cla.user = user;

                return cla.save().then(function (updatedCla) {
                    deferred.resolve(updatedCla);
                }).catch(function (err) {
                    deferred.reject(err);
                });
            }
            deferred.resolve(cla);
        });

        return deferred.promise;
    };

    let getPullRequestFiles = function (repo, owner, number, token) {
        return github.call({
            obj: 'pullRequests',
            fun: 'getFiles',
            arg: {
                repo: repo,
                owner: owner,
                number: number,
                noCache: true
            },
            token: token
        }).then(function (resp) {
            return resp.data;
        });
    };

    let isSignificantPullRequest = function (repo, owner, number, token) {
        if (!repo || !owner || !number) {
            return q.reject(new Error('There are NOT enough arguments for isSignificantPullRequest. Repo: ' + repo + ' Owner: ' + owner + ' Number: ' + number));
        }

        return getLinkedItem(repo, owner, token).then(function (item) {
            if (typeof item.minFileChanges !== 'number' && typeof item.minCodeChanges !== 'number') {
                return true;
            }
            token = token || item.token; // in case this method is called via controller/default.js check -> api/cla.js validatePullRequest -> services/cla.js isCLARequired there is no user token

            return getPullRequestFiles(repo, owner, number, token).then(function (files) {
                if (typeof item.minFileChanges === 'number' && files.length >= item.minFileChanges) {
                    return true;
                }
                if (typeof item.minCodeChanges === 'number') {
                    let sum = 0;

                    return files.some(function (file) {
                        sum += file.changes;

                        return sum >= item.minCodeChanges;
                    });
                }

                return false;
            });
        });
    };

    let triggerClaNotificationWebhook = function(argsToCreate) {
        // TODO: fill in logic for async call to webhook, with sth like:
        // var request = require('request');
        //
        // request.post(
        //     'http://www.yoursite.com/formpage',
        //     { json: { key: 'value' } },
        //     function (error, response, body) {
        //         if (!error && response.statusCode == 200) {
        //             console.log(body)
        //         }
        //     }
        // );
    };

  claService = {
        getGist: function (args, done) {
            let gist_url = args.gist ? args.gist.gist_url || args.gist.url || args.gist : undefined;
            // let gist_version = args.gist ? args.gist.gist_version : undefined;

            getGistObject(gist_url, args.token, done);
        },

        /**
         * Get the last signature of the current version cla at current moment or at a pull request moment
         * Params:
         *   user (mandatory)
         *   owner (mandatory)
         *   repo (optional)
         *   number (optional)
         */
        getLastSignature: function (args, done) {
            return getLinkedItem(args.repo, args.owner).then(function (item) {
                args.gist = item.gist;
                if (!item.gist) {
                    return 'null-cla';
                }

                return getGistObject(args.gist, item.token).then(function (gist) {
                    args.gist_version = gist.data.history[0].version;
                    args.onDates = [new Date()];
                    if (args.number) {
                        return getPR(args.owner, args.repo, args.number, item.token).then(function (pullRequest) {
                            args.onDates.push(new Date(pullRequest.created_at));

                            return args;
                        });
                    }

                    return args;
                }).then(function (args) {
                    return getLastSignatureOnMultiDates(args.user, args.userId, item.repoId, item.orgId, item.sharedGist, item.gist, args.gist_version, args.onDates).then(function (cla) {
                        return cla;
                    });
                });
            }).then(function (cla) {
                return done(null, cla);
            }).catch(function (error) {
                return done(error);
            });
        },

        /**
         * Check whether a user signed the current cla at current moment or at the pull request moment.
         * Params:
         *   user (mandatory)
         *   owner (mandatory)
         *   repo (optional)
         *   number (optional)
         */
        checkUserSignature: function (args, done) {
            let self = this;

            return self.getLastSignature(args, function (error, cla) {
                done(error, { signed: !!cla });
            });
        },

        /**
         * Check whether all committers signed the current cla at current moment or at the pull request moment.
         * Params:
         *   user (mandatory)
         *   number (mandatory)
         *   owner (mandatory)
         *   repo (optional)
         */
        checkPullRequestSignatures: function (args, done) {
            getLinkedItem(args.repo, args.owner, args.token).then(function (item) {
                args.gist = item.gist;
                args.repoId = item.repoId;
                args.orgId = item.orgId;
                args.onDates = [new Date()];
                if (!args.gist) {
                    return done(null, {
                        signed: true
                    });
                }

                return getGistObject(args.gist, item.token).then(function (gist) {
                    args.gist_version = gist.data.history[0].version;

                    return getPR(args.owner, args.repo, args.number, item.token).then(pullRequest => {
                        args.onDates.push(new Date(pullRequest.created_at));
                        const signees = [];
                        if (config.server.feature_flag.required_signees.indexOf('submitter') > -1) {
                            signees.push({
                                name: pullRequest.user.login,
                                id: pullRequest.user.id
                            });
                        }

                        return q(signees);
                    }).then(signees => {
                        const deferred = q.defer();
                        if (!config.server.feature_flag.required_signees || config.server.feature_flag.required_signees.indexOf('committer') > -1) {
                            repoService.getPRCommitters(args, function (error, committers) {
                                if (error) {
                                    logger.warn(new Error(error).stack);
                                }
                                signees = _.uniqWith(signees.concat(committers), (object, other) => {
                                    return object.id == other.id;
                                });
                                deferred.resolve(signees);
                            });
                        } else {
                            deferred.resolve(signees);
                        }

                        return deferred.promise;
                    }).then(signees => {
                        return checkAll(signees, item.repoId, item.orgId, item.sharedGist, item.gist, args.gist_version, args.onDates).then(function (result) {
                            done(null, result);
                        });
                    });
                });
            }).catch(function (er) {
                done(er);
            });
        },

        check: function (args, done) {
            let self = this;
            if (args.user) {
                return self.checkUserSignature(args, function (error, result) {
                    done(error, result.signed);
                });
            } else if (args.number) {
                return self.checkPullRequestSignatures(args, function (error, result) {
                    done(error, result.signed, result.user_map);
                });
            }

            return done(new Error('A user or a pull request number is required.'));
        },

        sign: function (args, done) {
            let self = this;

            return getLinkedItem(args.repo, args.owner, args.token).then(function (item) {
                if (!item.gist) {
                    let nullClaErr = new Error('The repository don\'t need to sign a CLA because it has a null CLA.');
                    nullClaErr.code = 200;
                    throw nullClaErr;
                }

                return getGistObject(item.gist, item.token).then(function (gist) {
                    let onDates = [new Date()];
                    let currentVersion = gist.data.history[0].version;

                    return getLastSignatureOnMultiDates(args.user, args.userId, item.repoId, item.orgId, item.sharedGist, item.gist, currentVersion, onDates).then(function (cla) {
                        if (cla) {
                            let signedErr = new Error('You\'ve already signed the cla');
                            signedErr.code = 200;
                            throw signedErr;
                        }
                        let argsToCreate = {
                            user: args.user,
                            userId: args.userId,
                            gist: item.gist,
                            gist_version: currentVersion,
                            custom_fields: args.custom_fields
                        };
                        if (!item.sharedGist) {
                            argsToCreate.ownerId = item.orgId;
                            argsToCreate.repoId = item.repoId;
                            argsToCreate.org_cla = !!item.orgId;
                            argsToCreate.owner = item.owner || item.org;
                            argsToCreate.repo = item.repo;
                        }
                        self.create(argsToCreate, function (error) {
                            triggerClaNotificationWebhook(argsToCreate);
                            done(error, 'done');
                        });
                    });
                });
            }).catch(function (error) {
                done(error);
            });
        },

        //Get list of signed CLAs for all repos the user has contributed to
        getSignedCLA: function (args, done) {
            let selector = [];
            let findCla = function (query, repoList, claList, cb) {
                CLA.find(query, {
                    'repo': '*',
                    'owner': '*',
                    'created_at': '*',
                    'gist_url': '*',
                    'gist_version': '*'
                }, {
                        sort: {
                            'created_at': -1
                        }
                    }, function (err, clas) {
                        if (err) {
                            logger.warn(new Error(err).stack);
                        } else {
                            clas.forEach(function (cla) {
                                if (repoList.indexOf(cla.repo) < 0) {
                                    repoList.push(cla.repo);
                                    claList.push(cla);
                                }
                            });
                        }
                        cb();
                    });
            };

            repoService.all(function (e, repos) {
                if (e) {
                    logger.warn(new Error(e).stack);
                }
                repos.forEach(function (repo) {
                    selector.push({
                        user: args.user,
                        repo: repo.repo,
                        gist_url: repo.gist
                    });
                });
                let repoList = [];
                let uniqueClaList = [];
                findCla({
                    $or: selector
                }, repoList, uniqueClaList, function () {
                    findCla({
                        user: args.user
                    }, repoList, uniqueClaList, function () {
                        done(null, uniqueClaList);
                    });
                });
            });
        },

        // Get linked repo or org
        // Params:
        // repo (mandatory)
        // owner (mandatory)
        // token (optional)
        getLinkedItem: function (args, done) {
            getLinkedItem(args.repo, args.owner, args.token).then(
                function (item) {
                    done(null, item);
                },
                function (err) {
                    done(err);
                }
            );
        },

        //Get all signed CLAs for given repo and gist url and/or a given gist version
        //Params:
        //	repoId (mandatory) or
        //	orgId (mandatory) and
        //	gist.gist_url (mandatory)
        //	gist.gist_version (optional)
        getAll: function (args, done) {
            if (!args.gist || !args.gist.gist_url || (!args.repoId && !args.orgId)) {
                done('Wrong arguments, gist url or repo id are missing');

                return;
            }
            let selection = {
                gist_url: args.gist.gist_url
            };
            let options = {
                sort: {
                    user: 1,
                    userId: 1
                }
            };
            if (args.gist.gist_version) {
                selection.gist_version = args.gist.gist_version;
                options.sort = {
                    'created_at': -1
                };
            }
            if (args.repoId) {
                selection.repoId = args.repoId;
            }
            if (args.orgId) {
                selection.ownerId = args.orgId;
            }
            selection = updateQuery(selection, args.sharedGist);

            if (!args.gist.gist_version) {
                CLA.find(selection, {}, options, done);
            } else {
                CLA.find(selection, {}, options, function (err, clas) {
                    if (err || !clas) {
                        done(err);

                        return;
                    }
                    let foundSigners = [];
                    let distinctClas = clas.filter(function (cla) {
                        if (foundSigners.indexOf(cla.userId) < 0) {
                            foundSigners.push(cla.userId);

                            return true;
                        }

                        return false;
                    });
                    done(null, distinctClas);
                });
            }
        },

        create: function (args, done) {
            let now = new Date();

            CLA.create({
                repo: args.repo,
                repoId: args.repoId,
                owner: args.owner,
                ownerId: args.ownerId,
                user: args.user,
                userId: args.userId,
                gist_url: args.gist,
                gist_version: args.gist_version,
                created_at: now,
                end_at: undefined,
                org_cla: args.org_cla,
                custom_fields: args.custom_fields
            }, function (err, res) {
                done(err, res);
            });
        },

        terminate: function (args, done) {
            return getLinkedItem(args.repo, args.owner, args.token).then(function (item) {
                if (!item.gist) {
                    let nullClaErr = new Error('The repository don\'t need to sign a CLA because it has a null CLA.');
                    nullClaErr.code = 200;
                    throw nullClaErr;
                }

                return getGistObject(item.gist, item.token).then(function (gist) {
                    let endDate = new Date(args.endDate);
                    let onDates = [endDate];
                    let currentVersion = gist.data.history[0].version;

                    return getLastSignatureOnMultiDates(args.user, args.userId, item.repoId, item.orgId, item.sharedGist, item.gist, currentVersion, onDates).then(function (cla) {
                        if (!cla) {
                            let noRecordErr = new Error('No valid cla record');
                            noRecordErr.code = 200;
                            throw noRecordErr;
                        }
                        cla.end_at = endDate;

                        return cla.save().then(function (dbCla) {
                            done(null, dbCla);
                        });
                    });
                });
            }).catch(function (error) {
                done(error);
            });
        },

        isClaRequired: function (args, done) {
            return isSignificantPullRequest(args.repo, args.owner, args.number, args.token).then(function (isSignificant) {
                done(null, isSignificant);
            }).catch(done);
        }
    };

    return claService;
}();
