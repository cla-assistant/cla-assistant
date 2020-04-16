const User = require('mongoose').model('User')
const logger = require('./logger')

class UserService {

    async findUser(profile, accessToken) {
        if (global.config.server.useCouch) {
            await global.cladb.find({ selector: { type: 'entity', table: 'user', name: profile.usernme }, limit: 1 }).then(function (users) {
                if (users.docs.length == 0) {
                    global.cladb.insert({
                        type: 'entity',
                        table: 'user',
                        uuid: profile.uuid,
                        name: profile.username,
                        token: accessToken,
                        requests: []
                    })
                    return
                }
                users.docs[0].uuid = profile.uuid
                users.docs[0].token = accessToken
                global.cladb.insert(users.docs[0])
            }, function (error) {
                logger.warn(new Error(`Could not create new user ${error}`).stack)
            })
        } else {
            let user
            try {
                user = await User.findOne({
                    name: profile.username
                })

                if (user) {
                    if (!user.uuid) {
                        user.uuid = profile.id
                    }
                    user.token = accessToken
                    user.save()
                }
            } catch (error) {
                logger.warn(error.stack)
            }

            if (!user) {
                try {
                    await User.create({
                        uuid: profile.id,
                        name: profile.username,
                        token: accessToken
                    })
                } catch (error) {
                    logger.warn(new Error(`Could not create new user ${error}`).stack)
                }
            }
        }
    }

    async byName(userName) {
        if (global.config.server.useCouch) {
            return (await global.cladb.find({ selector: { type: 'entity', table: 'user', username: userName }, limit: 1 })).docs[0]
        }
        return await User.findOne({ name: userName })
    }


    async byUUIDAndName(uuid, userName) {
        if (global.config.server.useCouch) {
            return (await global.cladb.find({ selector: { type: 'entity', table: 'user', uuid: uuid, username: userName }, limit: 1 })).docs[0]
        }
        return await User.findOne({ uuid: uuid, name: userName })
    }

    async save(user, accessToken) {
        if (global.config.server.useCouch) {
            user.token = accessToken || user.token
            var result = await global.cladb.insert(user)
            return await global.cladb.get(result.id)
        }
        return await user.save()
    }

    async all() {
        if (global.config.server.useCouch) {
            return (await global.cladb.find({ selector: { type: 'entity', table: 'user' } })).docs[0]
        }
        return await User.find({})
    }
}

module.exports = new UserService()