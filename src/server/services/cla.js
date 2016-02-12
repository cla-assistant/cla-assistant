// models
require('../documents/cla');
// require('../documents/user');
var https = require('https');
var q = require('q');
var CLA = require('mongoose').model('CLA');

//services
var repoService = require('../services/repo');
var logger = require('../services/logger');

module.exports = function(){
    var claService;

    var	checkAll = function (users, args) {
        var deferred = q.defer();
        var all_signed = true;
        var promises = [];
        var user_map = {signed: [], not_signed: [], unknown: []};
        if (!users) {
            deferred.reject('There are no users to check :( ');
            return deferred.promise;
        }
        users.forEach(function(user){
            args.user = user.name;
            user_map.not_signed.push(user.name);
            if (!user.id) {
                user_map.unknown.push(user.name);
            }
            promises.push(claService.get(args, function(err, cla){
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
        q.all(promises).then(function(){
            deferred.resolve({signed: all_signed, user_map: user_map});
        });
        return deferred.promise;
    };

    claService = {
        getGist: function(args, done){
            try{
                var gist_url = args.gist.gist_url || args.gist.url || args.gist;
                var gistArray = gist_url.split('/'); // https://gist.github.com/KharitonOff/60e9b5d7ce65ca474c29

            } catch(ex) {
                done('The gist url "' + gist_url + '" seems to be invalid');
                return;
            }

            var path = '/gists/';
            var id = gistArray[gistArray.length - 1];
            path += id;
            if (args.gist.gist_version) {
                path = path + '/' + args.gist.gist_version;
            }

            var req = {};
            var data = '';
            var options = {
                hostname: config.server.github.api,
                port: 443,
                path: path,
                method: 'GET',
                headers: {
                    'Authorization': 'token ' + args.token,
                    'User-Agent': 'cla-assistant'
                }
            };

            req = https.request(options, function(res){
                res.on('data', function(chunk) { data += chunk; });
                res.on('end', function(){
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        logger.warn(new Error(e).stack);
                    }
                    done(null, data);
                });
            });

            req.end();
            req.on('error', function (e) {
                done(e);
            });
        },
        getRepo: function(args, done) {
            var deferred = q.defer();
            repoService.get(args, function(err, repo){
                if (!err && repo) {
                    deferred.resolve(repo);
                }
                if(typeof done === 'function'){
                    done(err, repo);
                }
            });
            return deferred.promise;
        },

        get: function(args, done) {
            var deferred = q.defer();
            var findCla = function (){
                CLA.findOne({repoId: args.repoId, user: args.user, gist_url: args.gist, gist_version: args.gist_version}, function(err, cla){
                    deferred.resolve();
                    if(typeof done === 'function'){
                        done(err, cla);
                    }
                });
            };
            if (!args.repoId) {
                this.getRepo(args, function(error, repo){
                    if (error || !repo) {
                        deferred.reject();
                        if(typeof done === 'function'){
                            done(error);
                        }
                    }
                    args.repoId = repo.repoId;
                    findCla();
                });
            } else {
                findCla();
            }
            return deferred.promise;
        },

        //Get last signature of the user for given repository and gist url
        getLastSignature: function(args, done) {
            var deferred = q.defer();
            CLA.findOne({repo: args.repo, owner: args.owner, user: args.user, gist_url: args.gist_url}, {'repo': '*', 'owner': '*', 'created_at': '*', 'gist_url': '*', 'gist_version': '*'}, {select: {'created_at': -1}}, function(err, cla){
                if (!err && cla) {
                    deferred.resolve(cla);
                }
                if(typeof done === 'function'){
                    done(err, cla);
                }
            });
            return deferred.promise;
        },


        check: function(args, done){
            var self = this;

            this.getRepo(args, function(e, repo){
                if (e || !repo || !repo.gist) {
                    done(e, false);
                    return;
                }

                args.gist = repo.gist;
                args.repoId = repo.repoId;

                self.getGist(repo, function(err, gist){
                    if (err || !gist.history) {
                        done(err, false);
                        return;
                    }
                    args.gist_version = gist.history[0].version;

                    if (args.user) {
                        self.get(args, function(error, cla){
                            done(error, !!cla);
                        });
                    }
                    else if (args.number) {
                        repoService.getPRCommitters(args, function(error, committers){
                            if (error) {
                                logger.warn(new Error(error).stack);
                            }
                            checkAll(committers, args).then(function(result){
                                done(null, result.signed, result.user_map);
                            },
                            function(error_msg){
                                done(error_msg, false);
                            });
                        });
                    }
                });
            });
        },

        sign: function(args, done) {
            var self = this;

            self.check(args, function(e, signed){
                if (e || signed) {
                    done(e);
                    return;
                }

                self.getRepo(args, function(err, repo){
                    if (err || !repo) {
                        done(err);
                        return;
                    }

                    args.gist_url = repo.gist;
                    args.repoId = repo.repoId;

                    self.create(args, function(error){
                        if (error) {
                            done(error);
                            return;
                        }
                        done(error, 'done');
                    });
                });
            });
        },

        //Get list of signed CLAs for all repos the user has contributed to
        getSignedCLA: function(args, done){
            var selector = [];
            var findCla = function(query, repoList, claList, cb){
                CLA.find(query, {'repo': '*', 'owner': '*', 'created_at': '*', 'gist_url': '*', 'gist_version': '*'}, {sort: {'created_at': -1}}, function(err, clas){
                    if (err) {
                        logger.warn(new Error(err).stack);
                    } else {
                        clas.forEach(function(cla){
                            if(repoList.indexOf(cla.repo) < 0){
                                repoList.push(cla.repo);
                                claList.push(cla);
                            }
                        });
                    }
                    cb();
                });
            };

            repoService.all(function(e, repos){
                if (e) {
                    logger.warn(new Error(e).stack);
                }
                repos.forEach(function(repo){
                    selector.push({
                        user: args.user,
                        repo: repo.repo,
                        gist_url: repo.gist
                    });
                });
                var repoList = [];
                var uniqueClaList = [];
                findCla({$or: selector}, repoList, uniqueClaList, function(){
                    findCla({user: args.user}, repoList, uniqueClaList, function(){
                        done(null, uniqueClaList);
                    });
                });
            });
        },

        // updateDBData: function(req, done){
        //     logger.info(req.user);
        //     CLA.find({}, function(err, clas){
        //         if (!err && clas) {
        //             clas.forEach(function(cla){
        //                 repoService.getGHRepo({owner: cla.owner, repo: cla.repo, token: req.user.token}, function(e, ghRepo){
        //                     if (ghRepo && ghRepo.id) {
        //                         cla.repoId = ghRepo.id;
        //                         if (cla.owner !== ghRepo.owner.login || cla.repo !== ghRepo.name) {
        //                             logger.info(ghRepo.full_name, ' != ', cla.owner, '/', cla.repo);
        //                             cla.owner = ghRepo.owner.login;
        //                             cla.repo = ghRepo.name;
        //                             logger.info('transfered to ', cla.owner, '/', cla.repo, 'id:', cla.repoId);
        //                         }
        //                         cla.save();
        //                     }
        //                 });
        //             });
        //             done('updating ' + clas.length + ' CLAs...');
        //         } else {
        //             done(err);
        //         }
        //     });
        // },

        //Get all signed CLAs for given repo and gist url and/or a given gist version
        //Params:
        //	repo (mandatory)
        //	owner (mandatory)
        //	gist.gist_url (mandatory)
        //	gist.gist_version (optional)
        getAll: function(args, done) {
            var selection = {gist_url: args.gist.gist_url};
            if (args.gist.gist_version) {
                selection.gist_version = args.gist.gist_version;
            }
            var findClas = function(){
                CLA.find(selection, done);
            };
            if (args.repoId) {
                selection.repoId = args.repoId;
                findClas();
            } else {
                this.getRepo(args, function(err, repo){
                    if (!err && repo) {
                        selection.repoId = repo.repoId;
                        findClas();
                    } else {
                        done(err);
                    }

                });
            }
        },
        create: function(args, done){
            var now = new Date();

            CLA.create({repo: args.repo, owner: args.owner, repoId: args.repoId, user: args.user, gist_url: args.gist, gist_version: args.gist_version, created_at: now}, function(err, res){
                done(err, res);
            });
        }
    };
    return claService;
}();
