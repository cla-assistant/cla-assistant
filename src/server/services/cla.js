// models
require('../documents/cla');
// require('../documents/user');
let https = require('https');
let q = require('q');
let CLA = require('mongoose').model('CLA');

//services
let logger = require('../services/logger');
let orgService = require('../services/org');
let repoService = require('../services/repo');
let github = require('../services/github');

let config = require('../../config');

module.exports = function () {
    let claService;

    let getGistObject = function (gist_url, gist_version, token, done) {
        // let deferred = q.defer();
        let id = '';
        try {
            let gistArray = gist_url.split('/'); // https://gist.github.com/KharitonOff/60e9b5d7ce65ca474c29
            id = gistArray[gistArray.length - 1];
        } catch (ex) {
            done('The gist url "' + gist_url + '" seems to be invalid');
            return;
        }
        args = {
            obj: 'gists',
            fun: 'get',
            arg: {
                id: id
            },
            token: token
        };
        github.call(args, done);
        // let path = '/gists/' + id;

        // path += gist_version ? '/' + gist_version : '';

        // let req = {};
        // let data = '';
        // let options = {
        //     hostname: config.server.github.api,
        //     port: 443,
        //     path: path,
        //     method: 'GET',
        //     headers: {
        //         'Authorization': 'token ' + token,
        //         'User-Agent': 'cla-assistant'
        //     }
        // };

        // req = https.request(options, function (res) {
        //     res.on('data', function (chunk) {
        //         data += chunk;
        //     });
        //     res.on('end', function () {
        //         try {
        //             data = JSON.parse(data);
        //         } catch (e) {
        //             logger.warn(new Error(e).stack);
        //         }
        //         deferred.resolve(data);
        //     });
        // });

        // req.end();
        // req.on('error', function (e) {
        //     deferred.reject(e);
        // });
        // return deferred.promise;
    };


    let checkAll = function (users, args) {
        let deferred = q.defer();
        let all_signed = true;
        let promises = [];
        let user_map = {
            signed: [],
            not_signed: [],
            unknown: []
        };
        if (!users) {
            deferred.reject('There are no users to check :( ', args);
            return deferred.promise;
        }
        users.forEach(function (user) {
            args.user = user.name;
            user_map.not_signed.push(user.name);
            if (!user.id) {
                user_map.unknown.push(user.name);
            }
            promises.push(claService.get(args, function (err, cla) {
                if (err) {
                    logger.warn(new Error(err).stack);
                }
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

    let updateQuery = function (query, sharedGist) {
        if (sharedGist) {
            let addition = {
                owner: undefined,
                repo: undefined,
                gist_url: query.gist_url,
            };
            if (query.gist_version) {
                addition.gist_version = query.gist_version;
            }
            if (query.user) {
                addition.user = query.user;
            }
            return {
                $or: [query, addition]
            };
        }
        return query;
    };

    let check = function (repo, owner, gist_url, user, pr_number, token, repoId, orgId, sharedGist, gist_version) {
        let deferred = q.defer();

        let runCheck = function (repo, owner, gist_url, user, pr_number, token, repoId, orgId, sharedGist, gist_version) {
            let args = {
                user: user,
                gist: gist_url,
                gist_version: gist_version,
                repo: repo,
                owner: owner,
                sharedGist: sharedGist
            };
            args.repoId = repoId ? repoId : undefined;
            args.orgId = orgId ? orgId : undefined;

            if (user) {
                claService.get(args, function (error, cla) {
                    deferred.resolve({
                        signed: !!cla
                    });
                });
            } else if (pr_number) {
                args.number = pr_number;
                repoService.getPRCommitters(args, function (error, committers) {
                    if (error) {
                        logger.warn(new Error(error).stack);
                    }
                    checkAll(committers, args).then(
                        function (result) {
                            deferred.resolve(result);
                        },
                        function (error_msg) {
                            deferred.reject(error_msg);
                        }
                    );
                });
            }
        };

        if (gist_version) {
            runCheck(repo, owner, gist_url, user, pr_number, token, repoId, orgId, sharedGist, gist_version);
        } else {
            getGistObject(gist_url, undefined, token, function (err, gist) {
                if (err || !gist.history) {
                    deferred.reject(err || 'No versions found for the given gist url');
                    return;
                }
                runCheck(repo, owner, gist_url, user, pr_number, token, repoId, orgId, sharedGist, gist.history[0].version);
            });
        }

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

    let getRepo = function (args, done) {
        let deferred = q.defer();
        repoService.get(args, function (err, repo) {
            if (!err && repo) {
                deferred.resolve(repo);
            } else {
                deferred.reject(err);
            }
            if (typeof done === 'function') {
                done(err, repo);
            }
        });
        return deferred.promise;
    };

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
                    orgService.get({
                        orgId: ghRepo.owner.id
                    }, function (err, linkedOrg) {
                        if (!linkedOrg) {
                            repoService.get({
                                repoId: ghRepo.id
                            }, function (error, linkedRepo) {
                                if (linkedRepo) {
                                    deferred.resolve(linkedRepo);
                                } else {
                                    deferred.reject(error);
                                }
                            });
                        } else {
                            deferred.resolve(linkedOrg);
                        }
                    });
                }
            });
        }
        return deferred.promise;
    };

    claService = {
        getGist: function (args, done) {
            let gist_url = args.gist ? args.gist.gist_url || args.gist.url || args.gist : undefined;
            let gist_version = args.gist ? args.gist.gist_version : undefined;

            getGistObject(gist_url, gist_version, args.token, done);
        },

        get: function (args, done) {
            let deferred = q.defer();
            let query = {
                user: args.user,
                gist_url: args.gist,
                gist_version: args.gist_version,
                org_cla: false
            };

            let findCla = function () {
                query = updateQuery(query, args.sharedGist);
                CLA.findOne(query, function (err, cla) {
                    deferred.resolve();
                    if (typeof done === 'function') {
                        done(err, cla);
                    }
                });
            };
            if (!args.repoId && !args.orgId) {
                getRepo(args, function (error, repo) {
                    if (error || !repo) {
                        deferred.reject();
                        if (typeof done === 'function') {
                            done(error);
                        }
                        return;
                    }
                    query.repoId = repo.repoId;
                    findCla();
                });
            } else if (args.orgId) {
                query.ownerId = args.orgId;
                query.org_cla = true;
                findCla();
            } else {
                query.repoId = args.repoId;
                findCla();
            }
            return deferred.promise;
        },

        //Get last signature of the user for given repository and gist url
        getLastSignature: function (args, done) {
            let deferred = q.defer();
            getLinkedItem(args.repo, args.owner, args.token).then(function (item) {
                let query = {
                    user: args.user,
                    gist_url: item.gist
                };
                if (item.orgId) {
                    query.ownerId = item.orgId;
                    query.org_cla = true;
                } else if (item.repoId) {
                    query.repoId = item.repoId;
                }

                // CLA.findOne({
                //     '$query': query,
                //     '$orderby': {
                //         'created_at': -1
                //     }
                // }, function (err, cla) {
                query = updateQuery(query, item.sharedGist);
                CLA.findOne(query, {}, {
                    sort: {
                        'created_at': -1
                    }
                }, function (err, cla) {
                    if (!err && cla) {
                        deferred.resolve(cla);
                    }
                    if (typeof done === 'function') {
                        done(err, cla);
                    }
                });
            }, function (err) {
                deferred.reject(err);
                if (typeof done === 'function') {
                    done(err);
                }
            });
            return deferred.promise;
        },


        check: function (args, done) {
            if (!args.gist || !args.token || args.sharedGist === undefined) {
                getLinkedItem(args.repo, args.owner, args.token).then(function (item) {
                    args.gist = item.gist;
                    args.token = item.token;
                    if (item.orgId) {
                        args.orgId = item.orgId;
                    } else if (item.repoId) {
                        args.repoId = item.repoId;
                    }

                    check(args.repo, args.owner, args.gist, args.user, args.number, item.token, args.repoId, args.orgId, item.sharedGist).then(function (result) {
                        done(null, result.signed, result.user_map);
                    }, function (err) {
                        done(err);
                    });

                }, function (e) {
                    done(e);
                });
            } else {
                check(args.repo, args.owner, args.gist, args.user, args.number, args.token, args.repoId, args.orgId, args.sharedGist, args.gist_version).then(function (result) {
                    done(null, result.signed, result.user_map);
                }, function (err) {
                    done(err);
                });
            }
        },

        sign: function (args, done) {
            let self = this;
            let org, repo;

            if (!args.item) {
                getLinkedItem(args.repo, args.owner, args.token).then(function (item) {
                    saveSignature(item);
                });
            } else {
                saveSignature(args.item);
            }

            function saveSignature(item) {
                org = item.orgId ? item : undefined;
                repo = item.orgId ? undefined : item;

                let argsToCheck = args;
                argsToCheck.gist = argsToCheck.gist ? argsToCheck.gist : item.gist;
                argsToCheck.token = item.token;
                argsToCheck.orgId = item.orgId ? item.orgId : undefined;
                argsToCheck.sharedGist = !!item.sharedGist;

                getGistObject(item.gist, undefined, item.token, function (err, gist) {
                    if (err && !gist.history) {
                        let msg = 'Could not get gist version ' + err;
                        logger.warn(new Error(msg).stack);
                        done(msg);
                        return;
                    }
                    argsToCheck.gist_version = gist.history[0].version ? gist.history[0].version : undefined;

                    self.check(argsToCheck, function (e, signed) {
                        if (e || signed) {
                            done(e);
                            return;
                        }

                        let argsToCreate = {};
                        argsToCreate.gist = repo ? repo.gist : org.gist;
                        argsToCreate.gist_version = gist.history[0].version;
                        argsToCreate.user = args.user;
                        argsToCreate.userId = args.userId;
                        argsToCreate.custom_fields = args.custom_fields;
                        if (!item.sharedGist) {
                            argsToCreate.owner = repo ? repo.owner : org.org;
                            argsToCreate.ownerId = repo ? repo.ownerId : org.orgId;
                            argsToCreate.org_cla = org ? true : false;
                            argsToCreate.repo = repo ? repo.repo : args.repo;
                            argsToCreate.repoId = repo ? repo.repoId : undefined;
                        }

                        self.create(argsToCreate, function (error) {
                            if (error) {
                                done(error);
                                return;
                            }
                            done(error, 'done');
                        });
                    });
                });
            }

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
            var options = {};
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
                    var foundSigners = [];
                    var distinctClas = clas.filter(function (cla) {
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
                org_cla: args.org_cla,
                custom_fields: args.custom_fields
            }, function (err, res) {
                done(err, res);
            });
        }
    };
    return claService;
}();
