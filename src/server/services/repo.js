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
    var committer = commit.author || commit.commit.author || commit.committer || commit.commit.committer;

    return committer;
};

var getPullRequest = function (owner, repo, number, token, done) {
    github.call({
        obj: 'pullRequests',
        fun: 'get',
        arg: {
            repo: repo,
            owner: owner,
            number: number
        },
        token: token
    }, done);
};

var getCommit = function (owner, repo, sha, token, done) {
    github.call({
        obj: 'repos',
        fun: 'getCommit',
        arg: {
            repo: repo,
            owner: owner,
            sha: sha
        },
        token: token
    }, done);
};

var selection = function (args) {
    return args.repoId ? {
        repoId: args.repoId
    } : {
            repo: args.repo,
            owner: args.owner
        };
};

module.exports = {
    timesToRetryGitHubCall: 30,
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
            token: args.token,
            sharedGist: !!args.sharedGist
        }, function (err, repo) {
            done(err, repo);
        });
    },
    get: function (args, done) {
        Repo.findOne(selection(args), function (err, repo) {
            if (!err && !repo) {
                err = 'Repository not found in Database';
            }
            done(err, repo);
        });
    },
    getAll: function (args, done) {
        var repoIds = [];
        args.set.forEach(function (repo) {
            repoIds.push({
                repoId: repo.repoId
            });
        });
        Repo.find({
            $or: repoIds
        }, done);
    },

    getByOwner: function (owner, done) {
        Repo.find({
            owner: owner
        }, done);
    },

    getRepoWithSharedGist: function (gist, done) {
        Repo.find({ gist: gist, sharedGist: true }, done);
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
            if (!arguments.count) {
                logger.info(new Error(err).stack);
                logger.info('getPRCommitters with arg: ', arguments);
            }
            done(err);
        };

        var callGithub = function (arg, linkedItem) {
            var committers = [];
            var linkedRepo = linkedItem && linkedItem.repoId ? linkedItem : undefined;

            github.call(arg, function (err, res) {
                if (err) {
                    logger.info(new Error(err).stack);
                    if (!res) {
                        handleError('No result on GH call, getting PR committers!', arg);
                        return;
                    }
                }
                if (res && !res.message) {
                    res.forEach(function (commit) {
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
                } else if (res.message) {
                    if (res && res.message === 'Moved Permanently' && linkedRepo) {
                        self.getGHRepo(args, function (err, res) {
                            if (res && res.id && compareRepoNameAndUpdate(linkedRepo, {
                                repo: res.name,
                                owner: res.owner.login,
                                repoId: res.id
                            })) {
                                arg.arg.repo = res.name;
                                arg.arg.owner = res.owner.login;

                                callGithub(arg);
                            } else {
                                handleError('Moved Permanently ', err, arg);
                            }
                        });
                    } else {
                        if (!arg.count) {
                            arg.count = self.timesToRetryGitHubCall;
                            setTimeout(function () {
                                callGithub(arg, linkedItem);
                            }, 1000 * self.timesToRetryGitHubCall);
                            return;
                        }
                        done(res.message);
                    }
                }

            });
        };

        var collectTokenAndCallGithub = function (args, item) {
            args.token = item.token;
            getPullRequest(args.owner, args.repo, args.number, args.token, function (err, pr) {
                if (err || !pr || pr.message) {
                    if (!args.count) {
                        args.count = self.timesToRetryGitHubCall;
                        setTimeout(function () {
                            console.log('call again ');
                            collectTokenAndCallGithub(args, item);
                        }, 1000 * self.timesToRetryGitHubCall);
                        return;
                    }
                }
                // args.url = url.githubPullRequestCommits(args.owner, args.repo, args.number);
                var params = {
                    obj: 'pullRequests',
                    fun: 'getCommits',
                    arg: {
                        owner: args.owner,
                        repo: args.repo,
                        number: args.number,
                        per_page: 100
                    },
                    token: args.token
                };
                if (!pr || !pr.commits || pr.commits < 250) { // 250 - limitation from GitHub for the PR-Commits API
                    callGithub(params, item);
                } else {
                    var headCommit = pr.head;
                    getCommit(args.owner, args.repo, pr.base.sha, args.token, function (err, commit) {
                        try {
                            if (err || !commit || !commit.commit.author.date) {
                                throw new Error(err);
                            }
                            // args.url = url.githubCommits(headCommit.repo.owner.login, headCommit.repo.name, headCommit.ref, commit.commit.author.date);
                            var allCommitsParams = {
                                obj: 'repos',
                                fun: 'getCommits',
                                arg: {
                                    owner: headCommit.repo.owner.login,
                                    repo: headCommit.repo.name,
                                    sha: headCommit.ref,
                                    since: commit.commit.author.date,
                                    per_page: 100
                                },
                                token: args.token
                            };
                            callGithub(allCommitsParams, item);
                        } catch (e) {
                            logger.info('Could not load all commits for the log PR, ', new Error(err).stack, ' called with args: ', args);
                            callGithub(params, item);
                            return;
                        }
                    });
                }
            });

        };

        orgService.get({
            orgId: args.orgId
        }, function (e, org) {
            if (!org) {
                self.get(args, function (e, repo) {
                    if (e || !repo) {
                        handleError(e, args);
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
        github.call({
            obj: 'repos',
            fun: 'getAll',
            arg: {
                affiliation: affiliation,
                per_page: 100
            },
            token: args.token
        }, function (err, res) {
            if (!res || res.length < 1 || res.message) {
                err = res && res.message ? res.message : err;
                done(err, null);
                return;
            }

            var repoSet = [];
            res.forEach(function (githubRepo) {
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
    //                 if (ghRepo && ghRepo && ghRepo.id) {
    //                     dbRepo.repoId = ghRepo.id;
    //                     dbRepo.save();
    //                 } else if (ghRepo && ghRepo && ghRepo.message) {
    //                     logger.info(ghRepo.message, 'with params ', params);
    //                 }
    //             });
    //         });
    //         done();
    //     });
    // },

    getGHRepo: function (args, done) {
        var params = {
            obj: 'repos',
            fun: 'get',
            arg: {
                owner: args.owner,
                repo: args.repo
            },
            token: args.token
        };
        github.call(params, done);
    }
};
