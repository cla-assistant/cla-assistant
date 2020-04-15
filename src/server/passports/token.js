const github = require('../services/github')
const passport = require('passport')
const Strategy = require('passport-accesstoken').Strategy
const merge = require('merge')
const userService = require('../services/user')

function getGHUser(accessToken) {
    const args = {
        obj: 'users',
        fun: 'getAuthenticated',
        token: accessToken
    }

    return github.call(args)
}

async function checkToken(accessToken) {
    const args = {
        obj: 'apps',
        fun: 'checkToken',
        arg: {
            access_token: accessToken,
            client_id: config.server.github.client
        },
        basicAuth: {
            user: config.server.github.client,
            pass: config.server.github.secret
        }
    }
    const res = await github.call(args)
    if (!res.data || (res.data && res.data.scopes && res.data.scopes.indexOf('write:repo_hook') < 0)) {
        throw new Error('You have not enough rights to call this API')
    }
    return res.data
}

passport.use(new Strategy(
    async (token, done) => {
        try {
            const res = await getGHUser(token)
            if (!res || !res.data) {
                throw new Error('Could not find GitHub user for given token')
            }
            const dbUser = await userService.byUUIDAndName(res.data.id, res.data.login)
            // async function(res) {
            //     if(global.config.server.useCouch) {
            //         User.find({ uuid: res.data.id, username: res.data.login }, function(error, users) {
            //             if(error) {
            //                 console.log(error.stack)
            //             } else {
            //                 if(users.length == 0) {
            //                     console.log(new Error(`no dbUser found for ${res}`))
            //                 } else {
            //                     console.log("user found")
            //                     return users[0]
            //                 }
            //             }
            //         })
            //     } else {
            //         return await User.findOne({ uuid: res.data.id, name: res.data.login })
            //     }
            // }
            if (!dbUser) {
                throw new Error(`Could not find user ${res.data.login} in the database`)
            }
            const authorization = await checkToken(dbUser.token)

            done(null, merge(res.data, {
                token: dbUser.token,
                scope: authorization.scopes.toString()
            }))
        } catch (error) {
            done(error)
        }
    }
))