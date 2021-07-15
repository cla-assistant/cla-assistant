let github = require('../services/github');
let passport = require('passport');
let Strategy = require('passport-accesstoken').Strategy;
let merge = require('merge');
let { request } = require('@octokit/request');

function getGHUser(accessToken, cb) {
    let args = {
        obj: 'users',
        fun: 'get',
        token: accessToken
    };

    github.call(args, function (err, data) {
        cb(err, data);
    });
}

async function checkToken(accessToken, cb) {
    try {
        const response = await request('POST /applications/{client_id}/token', {
            client_id: config.server.github.client,
            access_token: accessToken,
            headers: {
                authorization: `Basic ${Buffer.from(`${config.server.github.client}:${config.server.github.secret}`, 'utf8').toString('base64')}`,
            }
        });

        if (!response || response.status !== 200) {
            throw new Error(`checkToken failed with status code ${response.status}`);
        }
        const { data } = response;
        if (!data || (data && data.scopes && data.scopes.indexOf('write:repo_hook') < 0)) {
            throw new Error('You have not enough rights to call this API');
        }
        return cb(null, data);
    } catch (err) {
        cb(err);
    }
}

passport.use(new Strategy(
    function (token, done) {
        getGHUser(token, function (err, data) {
            if (err || !data) {
                done(err || 'Could not find GitHub user for given token');

                return;
            }
            models.User.findOne({
                uuid: data.id,
                name: data.login
            }, function (err, dbUser) {
                if (err || !dbUser) {
                    done(err || 'Could not find ' + data.login);

                    return;
                }
                checkToken(dbUser.token, function (err, authorization) {
                    if (err || !dbUser) {
                        done(err || 'Could not find ' + data.login);

                        return;
                    }
                    done(err, merge(data, {
                        token: dbUser.token,
                        scope: authorization.scopes.toString()
                    }));
                });
            });
        });

        // if (params.scope.indexOf('write:repo_hook') >= 0) {
        //     repoService.getUserRepos({ token: accessToken }, function (err, res) {
        //         if (res && res.length > 0) {
        //             res.forEach(function (repo) {
        //             });
        //         } else if (err) {
        //             logger.warn(err);
        //         }
        //     });
        // }
        // if (params.scope.indexOf('admin:org_hook') >= 0) {
        //     orgApi.getForUser({ user: { token: accessToken } }, function (err, res) {
        //         if (res && res.length > 0) {
        //             res.forEach(function (org) {
        //                 checkToken(org, accessToken);
        //             });
        //         } else if (err) {
        //             logger.warn(err);
        //         }
        //     });
        // }
    }
));