const url = require('./url')
const github = require('./github')
const logger = require('../services/logger')

const commentText = (signed, badgeUrl, claUrl, userMap, recheckUrl) => {
    if (signed) {
        return `[![CLA assistant check](${badgeUrl})](${claUrl}) <br/>All committers have signed the CLA.`
    }

    let committersCount = 1
    if (userMap && userMap.not_signed && userMap.signed) {
        committersCount = userMap.signed.length + userMap.not_signed.length
    }

    let youAll = (committersCount > 1 ? 'you all' : 'you')
    let text = `[![CLA assistant check](${badgeUrl})](${claUrl}) <br/>Thank you for your submission, we really appreciate it. Like many open source projects, we ask that ${youAll} sign our [Contributor License Agreement](${claUrl}) before we can accept your contribution.<br/>`
    if (committersCount > 1) {
        text += '**' + userMap.signed.length + '** out of **' + (userMap.signed.length + userMap.not_signed.length) + '** committers have signed the CLA.<br/>'
        userMap.signed.forEach(function (signee) {
            text += '<br/>:white_check_mark: ' + signee
        })
        userMap.not_signed.forEach(function (signee) {
            text += '<br/>:x: ' + signee
        })
        text += '<br/>'
    }

    if (userMap && userMap.hasExternalCommiter && userMap.hasExternalCommiter.check == true) {
        text += ` <br/> **Note:** In case you are already a member of **${userMap.hasExternalCommiter.orgName}**, there is no need to sign the CLA again because **${userMap.hasExternalCommiter.orgName}** has already signed the (Corporate) CLA, hence just make sure that your membership is public. If you are not a member of **${userMap.hasExternalCommiter.orgName}** then you need to accept our CLA. <br/>`
    }

    if (userMap && userMap.unknown && userMap.unknown.length > 0) {
        let seem = (userMap.unknown.length > 1 ? 'seem' : 'seems')
        text += `<hr/>**${userMap.unknown.join(', ')}** ${seem} not to be a GitHub user.`
        text += ' You need a GitHub account to be able to sign the CLA. If you have already a GitHub account, please [add the email address used for this commit to your account](https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/#commits-are-not-linked-to-any-user).<br/>'
    }
    text += `<sub>You have signed the CLA already but the status is still pending? Let us [recheck](${recheckUrl}) it.</sub>`

    return text
}
class PullRequestService {
    async badgeComment(owner, repo, pullNumber, signed, userMap) {
        let badgeUrl = url.pullRequestBadge(signed)
        try {
            const comment = await this.getComment({
                repo: repo,
                owner: owner,
                number: pullNumber
            })

            const claUrl = url.claURL(owner, repo, pullNumber)
            const recheckUrl = url.recheckPrUrl(owner, repo, pullNumber)
            const body = commentText(signed, badgeUrl, claUrl, userMap, recheckUrl)

            let fun
            const arg = {
                owner: owner,
                repo: repo,
                body: body,
                noCache: true
            }
            if (!comment && !signed) {
                fun = 'createComment'
                arg.issue_number = pullNumber
            } else if (comment && comment.id) {
                fun = 'updateComment'
                arg.comment_id = comment.id
            } else {
                return
            }

            await github.call({
                obj: 'issues',
                fun,
                arg,
                basicAuth: {
                    user: config.server.github.user,
                    pass: config.server.github.pass
                }
            })
        } catch (error) {
            logger.warn(new Error(error).stack)
        }
    }

    async getComment(args) {
        const res = await github.call({
            obj: 'issues',
            fun: 'listComments',
            arg: {
                owner: args.owner,
                repo: args.repo,
                issue_number: args.number,
                noCache: true
            },
            token: config.server.github.token
        })
        return res.data.find(comment => comment.body.match(/.*!\[CLA assistant check\].*/))
    }

    async editComment(args) {
        const badgeUrl = url.pullRequestBadge(args.signed)
        const claUrl = url.claURL(args.owner, args.repo, args.number)
        const recheckUrl = url.recheckPrUrl(args.owner, args.repo, args.number)
        try {

            const comment = await this.getComment({
                repo: args.repo,
                owner: args.owner,
                number: args.number
            })
            if (!comment) {
                return
            }

            const userMap = args.userMap ? args.userMap : null
            const body = commentText(args.signed, badgeUrl, claUrl, userMap, recheckUrl)

            await github.call({
                obj: 'issues',
                fun: 'updateComment',
                arg: {
                    owner: args.owner,
                    repo: args.repo,
                    comment_id: comment.id,
                    body: body,
                    noCache: true
                },
                basicAuth: {
                    user: config.server.github.user,
                    pass: config.server.github.pass
                }
            })
        } catch (error) {
            logger.warn(new Error(`${error} with args: ${args}`).stack)
        }
    }

    async deleteComment(args) {
        try {
            const comment = await this.getComment({
                repo: args.repo,
                owner: args.owner,
                number: args.number
            })
            if (!comment) {
                return
            }
            await github.call({
                obj: 'issues',
                fun: 'deleteComment',
                arg: {
                    owner: args.owner,
                    repo: args.repo,
                    comment_id: comment.id
                },
                basicAuth: {
                    user: config.server.github.user,
                    pass: config.server.github.pass
                }
            })
        } catch (error) {
            logger.warn(error, 'with args:', args.repo, args.owner, args.number)
        }
    }
}


module.exports = new PullRequestService()