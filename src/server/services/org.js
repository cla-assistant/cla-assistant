require('../documents/org');
var mongoose = require('mongoose');
var Org = mongoose.model('Org');

var selection = function (args) {
    var selectArguments = args.orgId ? { orgId: args.orgId } : { org: args.org };
    return selectArguments;
};

module.exports = {
    create: function (args, done) {
        Org.create({
            orgId: args.orgId,
            org: args.org,
            gist: args.gist,
            token: args.token,
            excludePattern: args.excludePattern,
            sharedGist: !!args.sharedGist
        }, function (err, org) {
            done(err, org);
        });
    },

    get: function (args, done) {
        Org.findOne(selection(args), done);
    },

    getMultiple: function (args, done) {
        Org.find({ orgId: { $in: args.orgId } }, done);
    },

    getOrgWithSharedGist: function (gist, done) {
        Org.find({ gist: gist, sharedGist: true }, done);
    },

    remove: function (args, done) {
        Org.remove(selection(args), done);
    }
};
