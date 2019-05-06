require('../documents/org');
const mongoose = require('mongoose');
const Org = mongoose.model('Org');

const selection = function (args) {
    const selectArguments = args.orgId ? { orgId: args.orgId } : { org: args.org };

    return selectArguments;
};

class OrgService {
    async create(args) {
        return Org.create({
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
        })
    }

    async get(args) {
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

        return org.save()
    }

    async getMultiple(args) {
        return Org.find({ orgId: { $in: args.orgId } })
    }

    async getOrgWithSharedGist(gist) {
        return Org.find({ gist: gist, sharedGist: true })
    }

    remove(args) {
        return Org.findOneAndRemove(selection(args))
    }
}

const orgService = new OrgService()
module.exports = orgService
