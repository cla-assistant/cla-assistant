require('../documents/repo');
var mongoose = require('mongoose');
var Repo = mongoose.model('Repo');

//services
var github = require('../services/github');
var logger = require('../services/logger');
var orgService = require('../services/org');

//services
var url = require('../services/url');

var isTransferredRenamed = function (dbRepo, ghRepo) {
    return ghRepo.repoId == dbRepo.repoId && (ghRepo.repo !== dbRepo.repo || ghRepo.owner !== dbRepo.owner);
};

var compareRepoNameAndUpdate = function (dbRepo, ghRepo) {
    if (isTransferredRenamed(dbRepo, ghRepo)) {
        dbRepo.owner = ghRepo.owner;
        dbRepo.repo = ghRepo.repo;
        dbRepo.save();
        return true;
    } else {
        return false;
    }
};

var compareAllRepos = function (ghRepos, dbRepos, done) {
    dbRepos.forEach(function (dbRepo) {
        ghRepos.some(function (ghRepo) {
            return compareRepoNameAndUpdate(dbRepo, ghRepo);
        });
    });
    done();
};

var extractUserFromCommit = function (commit) {
    var committer = commit.committer || commit.commit.committer;
    if (config.server.github.commit_bots.indexOf(committer.login) > -1) {
        committer = commit.author || commit.commit.author;
    }
    return committer;
};

var selection = function (args) {
    return args.repoId ? { repoId: args.repoId } : {
        repo: args.repo,
        owner: args.owner
    };
};

module.exports = {
    timesToRetryGitHubCall: 10,
    all: function (done) {
        Repo.find({}, function (err, repos) {
            done(err, repos);
        });
    },

    check: function (args, done) {
        Repo.findOne(selection(args), function (err, repo) {
            done(err, !!repo);
        });
    },
    create: function (args, done) {
        Repo.create({
            repo: args.repo,
            owner: args.owner,
            repoId: args.repoId,
            gist: args.gist,
            token: args.token
        }, function (err, repo) {
            done(err, repo);
        });
    },
    get: function (args, done) {
        Repo.findOne(selection(args), function (err, repo) {
            if(!err && !repo){
                err = 'Repository not found in Database';
            }
            done(err, repo);
        });
    },
    getAll: function (args, done) {
        var repoIds = [];
        args.set.forEach(function (repo) {
            repoIds.push({ repoId: repo.repoId });
        });
        Repo.find({
            $or: repoIds
        }, done);
    },

    getByOwner: function (owner, done) {
        Repo.find({ owner: owner }, done);
    },

    update: function (args, done) {
        var repoArgs = {
            repo: args.repo,
            owner: args.owner
        };
        Repo.findOne(repoArgs, function (err, repo) {
            if (err) {
                done(err);
                return;
            }
            repo.repoId = args.repoId;
            repo.gist = args.gist;
            repo.save(done);
        });
    },
    remove: function (args, done) {
        Repo.remove(selection(args)).exec(done);
    },

    getPRCommitters: function (args, done) {
        var self = this;

        var handleError = function (err, arguments) {
            logger.info(new Error(err).stack);
            logger.info('getPRCommitters with arg: ', arguments);
            done(err);
        };

        var callGithub = function (arg, linkedItem) {
            var committers = [];
            var linkedRepo = linkedItem && linkedItem.repoId ? linkedItem : undefined;

            github.direct_call(arg, function (err, res) {
                if (err) {
                    logger.info(new Error(err).stack);
                }
                if (res.data && !res.data.message) {
                    res.data.forEach(function (commit) {
                        try {
                            var committer = extractUserFromCommit(commit);
                        } catch (error) {
                            logger.warn('Problem on PR ', url.githubPullRequest(arg.owner, arg.repo, arg.number));
                            logger.warn(new Error('commit info seems to be wrong; ' + error).stack);
                            return;
                        }
                        var user = {
                            name: committer.login || committer.name,
                            id: committer.id || ''
                        };
                        if (committers.length === 0 || committers.map(function (c) {
                            return c.name;
                        }).indexOf(user.name) < 0) {
                            committers.push(user);
                        }
                    });
                    done(null, committers);
                } else if (res.data.message) {
                    arg.count = arg.count ? arg.count + 1 : 1;
                    if (res.data.message === 'Not Found' && arg.count < self.timesToRetryGitHubCall) {
                        setTimeout(function () {
                            callGithub(arg);
                        }, 1000);
                    } else if (res.data.message === 'Moved Permanently' && linkedRepo) {
                        self.getGHRepo(args, function (err, res) {
                            if (res && res.id && compareRepoNameAndUpdate(linkedRepo, { repo: res.name, owner: res.owner.login, repoId: res.id} )) {
                                arg.repo = res.name;
                                arg.owner = res.owner.login;
                                arg.url = url.githubPullRequestCommits(arg.owner, arg.repo, arg.number);

                                callGithub(arg);
                            } else {
                                handleError('Moved Permanently', arg);
                            }
                        });
                    }
                    else {
                        handleError(res.data.message, arg);
                    }
                }

            });
        };

        var collectTokenAndCallGithub = function (args, item) {
            args.token = item.token;
            args.url = url.githubPullRequestCommits(args.owner, args.repo, args.number);

            callGithub(args, item);
        };

        orgService.get({orgId: args.orgId}, function (e, org) {
            if (!org) {
                self.get(args, function (e, repo) {
                    if (e || !repo) {
                        var errorMsg = e;
                        errorMsg += 'with following arguments: ' + JSON.stringify(args);
                        logger.error(new Error(errorMsg).stack);
                        done(errorMsg);
                            return;
                    }
                    collectTokenAndCallGithub(args, repo);
                });
            } else {
                collectTokenAndCallGithub(args, org);
            }
        });
    },

    getUserRepos: function (args, done) {
        var that = this;
        var affiliation = args.affiliation ? args.affiliation : 'owner,organization_member';
        github.direct_call({
            url: 'https://api.github.com/user/repos?per_page=100;affiliation=' + affiliation,
            token: args.token
        }, function (err, res) {
            if (!res.data || res.data.length < 1 || res.data.message) {
                err = res.data && res.data.message ? res.data.message : err;
                done(err, null);
                return;
            }

            var repoSet = [];
            res.data.forEach(function (githubRepo) {
                if (githubRepo.permissions.push) {
                    repoSet.push({
                        owner: githubRepo.owner.login,
                        repo: githubRepo.name,
                        repoId: githubRepo.id
                    });
                }
            });
            that.getAll({
                set: repoSet
            }, function (err, dbRepos) {
                if (dbRepos) {
                    compareAllRepos(repoSet, dbRepos, function () {
                        done(err, dbRepos);
                    });
                } else {
                    done(err);
                }
            });
        });
    },

    // updateDBData: function(req, done) {
    //     var self = this;
    //     Repo.find({}, function(error, dbRepos){
    //         dbRepos.forEach(function(dbRepo){
    //             var params = {
    //                 url: url.githubRepository(dbRepo.owner, dbRepo.repo),
    //                 token: req.user.token
    //             };
    //             github.direct_call(params, function(err, ghRepo){
    //                 if (ghRepo && ghRepo.data && ghRepo.data.id) {
    //                     dbRepo.repoId = ghRepo.data.id;
    //                     dbRepo.save();
    //                 } else if (ghRepo && ghRepo.data && ghRepo.data.message) {
    //                     logger.info(ghRepo.data.message, 'with params ', params);
    //                 }
    //             });
    //         });
    //         done();
    //     });
    // },

    getGHRepo: function (args, done) {
        var params = {
            url: url.githubRepository(args.owner, args.repo),
            token: args.token
        };
        github.direct_call(params, function (err, ghRepo) {
            if (ghRepo && ghRepo.data && ghRepo.data.id) {
                done(err, ghRepo.data);
            } else if (ghRepo && ghRepo.data && ghRepo.data.url) {
                params.url = ghRepo.data.url;
                github.direct_call(params, function (e, ghRepository) {
                    done(e, ghRepository.data);
                });
            } else {
                done('GH Repo not found');
            }
        });
    }
};
