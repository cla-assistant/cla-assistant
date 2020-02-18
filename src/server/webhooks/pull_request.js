require('../documents/user')

// services
const pullRequest = require('../services/pullRequest')
const status = require('../services/status')
const cla = require('../services/cla')
const repoService = require('../services/repo')
const logger = require('../services/logger')
const userService = require('../services/user')

//////////////////////////////////////////////////////////////////////////////////////////////
// GitHub Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

function storeRequest(committers, repo, owner, number) {
    const pullRequest = {
        repo: repo,
        owner: owner,
        numbers: [number]
    }
    committers.forEach(async committer => {
        let user = await userService.byUserName(committer)
        if (!user.requests || user.requests.length < 1) {
            user.requests = user.requests ? user.requests : []
            user.requests.push(pullRequest)
            await userService.save(user, function (error) {
                if (error) {
                    console.log(error.stack)
                }
                else console.log("user requests initialized")
            })
            return
        }
        const repoPullRequests = user.requests.find(request => request.repo === repo && request.owner === owner)
        if (repoPullRequests && repoPullRequests.numbers.indexOf(number) < 0) {
            repoPullRequests.numbers.push(number)
            await save(user)
        }
        if (!repoPullRequests) {
            user.requests.push(pullRequest)
            await userService.save(user, function (error) {
                if (error) console.log(error.stack)
                else console.log("user pull requests updated")
            })
        }
        // } else {
        //     committers.forEach(async committer => {
        //         let user
        //         try {
        //             user = await User.findOne({
        //                 name: committer
        //             })
        //         } catch (error) {
        //             logger.warn(new Error(error).stack)
        //         }
        //         if (!user) {
        //             try {
        //                 User.create({
        //                     name: committer,
        //                     requests: [pullRequest]
        //                 })
        //             } catch (error) {
        //                 logger.warn(new Error(error).stack)
        //             }
        //             return
        //         }
        //         if (!user.requests || user.requests.length < 1) {
        //             user.requests = user.requests ? user.requests : []
        //             user.requests.push(pullRequest)
        //             await user.save()

        //             return
        //         }
        //         const repoPullRequests = user.requests.find(request => request.repo === repo && request.owner === owner)
        //         if (repoPullRequests && repoPullRequests.numbers.indexOf(number) < 0) {
        //             repoPullRequests.numbers.push(number)
        //             user.save()
        //         }
        //         if (!repoPullRequests) {
        //             user.requests.push(pullRequest)
        //             user.save()
        //         }
        //     })
    })
}

async function updateStatusAndComment(args, item) {
    try {
        // eslint-disable-next-line no-console
        //console.log('DEBUG: reposService.gerPRCommitters')
        const committers = await repoService.getPRCommitters(args)
        if (committers && committers.length > 0) {
            let checkResult
            try {
                // eslint-disable-next-line no-console
                //console.log('DEBUG: check cla')
                checkResult = await cla.check(args, item)
                // eslint-disable-next-line no-console
                console.log('DEBUG: updateStatusAndComment for the repo ' + JSON.stringify(args.repo))
            } catch (error) {
                logger.warn(new Error(error).stack)
            }
            args.signed = checkResult.signed
            if (!checkResult.userMap ||
                (checkResult.userMap.signed && checkResult.userMap.signed.length > 0) ||
                (checkResult.userMap.not_signed && checkResult.userMap.not_signed.length > 0) ||
                (checkResult.userMap.unknown && checkResult.userMap.unknown.length > 0)
            ) {
                status.update(args)
            } else {
                status.updateForClaNotRequired(args)
            }
            pullRequest.badgeComment(
                args.owner,
                args.repo,
                args.number,
                checkResult.signed,
                checkResult.userMap
            )
            if (checkResult.userMap && checkResult.userMap.not_signed) {
                storeRequest(checkResult.userMap.not_signed, args.repo, args.owner, args.number)
            }
        } else {
            logger.warn(new Error(`No committers found for the PR. Args: ${args}`).stack)
        }
    } catch (error) {
        if (!args.handleCount || args.handleCount < 2) {
            args.handleCount = args.handleCount ? ++args.handleCount : 1
            setTimeout(function () {
                updateStatusAndComment(args)
            }, 10000 * args.handleCount * args.handleDelay)
        } else {
            logger.warn(new Error(error).stack, 'updateStatusAndComment called with args: ', args)
        }
    }
}

async function handleWebHook(args, item) {
    try {
        const claRequired = await cla.isClaRequired(args, item)
        if (claRequired) {
            // eslint-disable-next-line no-console
            console.log("DEBUG: handleWebHook for the repo" + JSON.stringify(args.repo))
            return updateStatusAndComment(args, item)
        }

        status.updateForClaNotRequired(args)
        return pullRequest.deleteComment({
            repo: args.repo,
            owner: args.owner,
            number: args.number
        })
    } catch (error) {
        return logger.error(error)
    }
}

module.exports = async function (req, res) {

    if (['opened', 'reopened', 'synchronize'].indexOf(req.args.action) > -1 && (req.args.repository && req.args.repository.private == false)) {
        const args = {
            owner: req.args.repository.owner.login,
            repoId: req.args.repository.id,
            repo: req.args.repository.name,
            number: req.args.number
        }
        args.orgId = req.args.organization ? req.args.organization.id : req.args.repository.owner.id
        args.handleDelay = req.args.handleDelay != undefined ? req.args.handleDelay : 1 // needed for unitTests

        try {
            const item = await cla.getLinkedItem(args)
            let nullCla = !item.gist
            let isExcluded = item.orgId && item.isRepoExcluded && item.isRepoExcluded(args.repo)
            if (nullCla || isExcluded) {
                return
            }
            args.token = item.token
            args.gist = item.gist
            if (item.repoId) {
                args.orgId = undefined
            }

            handleWebHook(args, item)
        } catch (e) {
            logger.warn(e)

        }
    }
    res.status(200).send('OK')


}