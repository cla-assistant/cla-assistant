// models
require('../documents/cla');
// require('../documents/user');
var https = require('https');
var q = require('q');
var CLA = require('mongoose').model('CLA');

//services
var logger = require('../services/logger');
var orgService = require('../services/org');
var repoService = require('../services/repo');
var config = require('../../config');

module.exports = function () {
    var claService;

    var getGistObject = function (gist_url, gist_version, token) {
        var deferred = q.defer();
        try {
            var gistArray = gist_url.split('/'); // https://gist.github.com/KharitonOff/60e9b5d7ce65ca474c29
            var id = gistArray[gistArray.length - 1];
        } catch (ex) {
            deferred.reject('The gist url "' + gist_url + '" seems to be invalid');
            return deferred.promise;
        }
        var path = '/gists/' + id;

        path += gist_version ? '/' + gist_version : '';

        var req = {};
        var data = '';
        var options = {
            hostname: config.server.github.api,
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': 'token ' + token,
                'User-Agent': 'cla-assistant'
            }
        };

        req = https.request(options, function (res) {
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    logger.warn(new Error(e).stack);
                }
                deferred.resolve(data);
            });
        });

        req.end();
        req.on('error', function (e) {
            deferred.reject(e);
        });
        return deferred.promise;
    };


    var checkAll = function (users, args) {
        var deferred = q.defer();
        var all_signed = true;
        var promises = [];
        var user_map = { signed: [], not_signed: [], unknown: [] };
        if (!users) {
            deferred.reject('There are no users to check :( ');
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
                    var i = user_map.not_signed.indexOf(cla.user);
                    if (i >= 0) {
                        user_map.not_signed.splice(i, 1);
                    }
                    user_map.signed.push(cla.user);
                }
            }));
        });
        q.all(promises).then(function () {
            deferred.resolve({ signed: all_signed, user_map: user_map });
        });
        return deferred.promise;
    };

    var check = function (repo, owner, gist_url, user, pr_number, token, repoId, orgId) {
        var deferred = q.defer();

        getGistObject(gist_url, undefined, token).then(function (gist) {
            if (!gist.history) {
                deferred.reject('No versions found for the given gist url');
                return;
            }

            var args = {
                user: user,
                gist: gist_url,
                gist_version: gist.history[0].version,
                repo: repo,
                owner: owner,
            };
            args.repoId = repoId ? repoId : undefined;
            args.orgId = orgId ? orgId : undefined;

            if (user) {
                claService.get(args, function (error, cla) {
                    deferred.resolve({ signed: !!cla });
                });
            }
            else if (pr_number) {
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
        },
            function (e) {
                deferred.reject(e);
            }
        );
        return deferred.promise;
    };

    // var getOrg = function (args, done) {
    //     var deferred = q.defer();
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

    var getRepo = function (args, done) {
        var deferred = q.defer();
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

    var getLinkedItem = function (repo, owner, token) {
        var deferred = q.defer();
        token = token || config.server.github.token;

        if (owner && !repo) {
            orgService.get({ org: owner }, function (err, linkedOrg) {
                if (linkedOrg) {
                    deferred.resolve(linkedOrg);
                } else {
                    deferred.reject(err);
                }
            });
        } else {
            repoService.getGHRepo({ owner: owner, repo: repo, token: token }, function (e, ghRepo) {
                if(e){
                    // could not find the GH Repo
                    deferred.reject(e);
                } else {
                    orgService.get({ orgId: ghRepo.owner.id }, function (err, linkedOrg) {
                        if (!linkedOrg) {
                            repoService.get({ repoId: ghRepo.id }, function (error, linkedRepo) {
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
            var gist_url = args.gist ? args.gist.gist_url || args.gist.url || args.gist : undefined;
            var gist_version = args.gist ? args.gist.gist_version : undefined;

            getGistObject(gist_url, gist_version, args.token).then(function (gistObj) {
                done(null, gistObj);
            }, function (err) {
                done(err);
            });
        },

        get: function (args, done) {
            var deferred = q.defer();
            var query = { user: args.user, gist_url: args.gist, gist_version: args.gist_version, org_cla: false };

            var findCla = function () {
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
            var deferred = q.defer();
            getLinkedItem(args.repo, args.owner, args.token).then(function (item) {
                var query = { user: args.user, gist_url: item.gist };
                if (item.orgId) {
                    query.ownerId = item.orgId;
                    query.org_cla = true;
                } else if (item.repoId) {
                    query.repoId = item.repoId;
                }

                // CLA.findOne(query, { 'repo': '*', 'owner': '*', 'created_at': '*', 'gist_url': '*', 'gist_version': '*', 'user': '*', 'custom_fields': '*' }, { select: { 'created_at': -1 } }, function (err, cla) {
                CLA.findOne({ '$query': query, '$orderby': { 'created_at': -1 } }, function (err, cla) {
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
            if (!args.gist || !args.token) {
                getLinkedItem(args.repo, args.owner, args.token).then( function (item) {
                    args.gist = item.gist;
                    if (item.orgId) {
                        args.orgId = item.orgId;
                    } else if (item.repoId) {
                        args.repoId = item.repoId;
                    }

                    check(args.repo, args.owner, args.gist, args.user, args.number, item.token, args.repoId, args.orgId).then(function (result) {
                        done(null, result.signed, result.user_map);
                    }, function (err) {
                        done(err);
                    });

                }, function (e) {
                    done(e);
                });
            } else {
                check(args.repo, args.owner, args.gist, args.user, args.number, args.token, args.repoId, args.orgId).then(function (result) {
                    done(null, result.signed, result.user_map);
                }, function (err) {
                    done(err);
                });
            }
        },

        sign: function (args, done) {
            var self = this;
            var org, repo;

            getLinkedItem(args.repo, args.owner, args.token).then(function (item) {
                org = item.orgId ? item : undefined;
                repo = item.orgId ? undefined : item;

                var argsToCheck = args;
                argsToCheck.orgId = item.orgId ? item.orgId : undefined;

                self.check(argsToCheck, function (e, signed) {
                    if (e || signed) {
                        done(e);
                        return;
                    }

                    getGistObject(item.gist, undefined, item.token).then(function (gist) {
                        var argsToCreate = {};
                        argsToCreate.gist = repo ? repo.gist : org.gist;
                        argsToCreate.gist_version = gist.history[0].version;
                        argsToCreate.owner = repo ? repo.owner : org.org;
                        argsToCreate.ownerId = repo ? repo.ownerId : org.orgId;
                        argsToCreate.org_cla = org ? true : false;
                        argsToCreate.repo = repo ? repo.repo : args.repo;
                        argsToCreate.repoId = repo ? repo.repoId : undefined;
                        argsToCreate.user = args.user;
                        argsToCreate.userId = args.userId;
                        argsToCreate.custom_fields = args.custom_fields;

                        self.create(argsToCreate, function (error) {
                            if (error) {
                                done(error);
                                return;
                            }
                            done(error, 'done');
                        });
                    });
                });
            });
        },

        //Get list of signed CLAs for all repos the user has contributed to
        getSignedCLA: function (args, done) {
            var selector = [];
            var findCla = function (query, repoList, claList, cb) {
                CLA.find(query, { 'repo': '*', 'owner': '*', 'created_at': '*', 'gist_url': '*', 'gist_version': '*' }, { sort: { 'created_at': -1 } }, function (err, clas) {
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
                var repoList = [];
                var uniqueClaList = [];
                findCla({ $or: selector }, repoList, uniqueClaList, function () {
                    findCla({ user: args.user }, repoList, uniqueClaList, function () {
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
                }, function (err) {
                    done(err);
                }
            );
        },

        // updateDBData: function(req, done){
        //     logger.info(req.user);
        //     CLA.find({}, function(err, clas){
        //         if (!err && clas) {
        //             clas.forEach(function(cla){
        //                 // repoService.getGHRepo({owner: cla.owner, repo: cla.repo, token: req.user.token}, function(e, ghRepo){
        //                 //     if (ghRepo && ghRepo.id) {
        //                 //         cla.repoId = ghRepo.id;
        //                 //         if (cla.owner !== ghRepo.owner.login || cla.repo !== ghRepo.name) {
        //                 //             logger.info(ghRepo.full_name, ' != ', cla.owner, '/', cla.repo);
        //                 //             cla.owner = ghRepo.owner.login;
        //                 //             cla.repo = ghRepo.name;
        //                 //             logger.info('transfered to ', cla.owner, '/', cla.repo, 'id:', cla.repoId);
        //                 //         }
        //                 //         cla.save();
        //                 //     }
        //                 // });
        //                 if (!cla.org_cla) {
        //                     cla.org_cla = false;
        //                     cla.save(function (err, cla) {
        //                         if (err){
        //                             logger.info('Failed to update cla ', cla, err);
        //                         }
        //                     });
        //                 }
        //             });
        //             done('updating ' + clas.length + ' CLAs...');
        //         } else {
        //             done(err);
        //         }
        //     });
        // },

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
            var selection = { gist_url: args.gist.gist_url };
            if (args.gist.gist_version) {
                selection.gist_version = args.gist.gist_version;
            }
            if (args.repoId) {
                selection.repoId = args.repoId;
            }
            if (args.orgId) {
                selection.ownerId = args.orgId;
            }

            CLA.find(selection, done);
        },

        create: function (args, done) {
            var now = new Date();

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
} ();
