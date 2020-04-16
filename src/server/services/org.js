require('../documents/org');
const mongoose = require('mongoose');
const Org = mongoose.model('Org');

const selection = function (args) {
    const selectArguments = args.orgId ? { orgId: args.orgId } : { org: args.org };

    return selectArguments;
};

const selectionCouch = function (args) {
    const selectArguments = args.orgId ?
        { type: 'entity', table: 'org', orgId: args.orgId } :
        { type: 'entity', table: 'org', org: args.org };
    return selectArguments;
};

class OrgService {
    async create(args) {
        const newOrg = {
            orgId: args.orgId,
            org: args.org,
            gist: args.gist,
            token: args.token,
            excludePattern: args.excludePattern,
            sharedGist: !!args.sharedGist,
            minFileChanges: args.minFileChanges,
            minCodeChanges: args.minCodeChanges,
            whiteListPattern: args.whiteListPattern,
            privacyPolicy: args.privacyPolicy,
            updatedAt: new Date()
        }
        if (global.config.server.useCouch) {
            newOrg.type = 'entity'
            newOrg.table = 'org'
            var result = await global.cladb.insert(newOrg)
            return await global.cladb.get(result.id)
        }
        return await Org.create(newOrg)
    }

    async get(args) {
        if (global.config.server.useCouch) {
            return (await global.cladb.find({ selector: { type: 'entity', table: 'org', ...args }, limit: 1 })).docs
        }
        return Org.findOne(selection(args))
    }

    async update(args) {
        const org = await this.get(args)
        org.gist = args.gist
        org.token = args.token ? args.token : org.token
        org.sharedGist = !!args.sharedGist
        org.excludePattern = args.excludePattern
        org.minFileChanges = args.minFileChanges
        org.minCodeChanges = args.minCodeChanges
        org.whiteListPattern = args.whiteListPattern
        org.privacyPolicy = args.privacyPolicy
        org.updatedAt = new Date()
        if (global.config.server.useCouch) {
            var result = await global.cladb.insert({ type: 'entity', table: 'org', org })
            await global.cladb.get(result.id).then(function (org) {
                return org
            })
        } else {
            return await org.save()
        }
    }

    async getMultiple(args) {
        if (global.config.server.useCouch) {
            return (await global.cladb.find({ selector: { type: 'entity', table: 'org', orgId: { $in: args.orgId } } })).docs
        }
        return await Org.find({ orgId: { $in: args.orgId } })
    }

    async getOrgWithSharedGist(gist) {
        if (global.config.server.useCouch) {
            return (await global.cladb.find({ selector: { type: 'entity', table: 'org', gist: gist, sharedGist: true } })).docs
        }
        return Org.find({ gist: gist, sharedGist: true })
    }

    async remove(args) {
        if (global.config.server.useCouch) {
            await global.cladb.find({ selector: selectionCouch(args), limit: 1 }).then(function (repos) {
                repos.docs.forEach((repo) => global.cladb.remove(repo._id, repo._rev))
            })
        } else {
            return Org.findOneAndRemove(selection(args))
        }
    }
}

const orgService = new OrgService()
module.exports = orgService
