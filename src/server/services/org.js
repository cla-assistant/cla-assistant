require('../documents/org');
var mongoose = require('mongoose');
var Org = mongoose.model('Org');

module.exports = {
    create: function (args, done) {
        Org.create({
            orgId: args.orgId,
            org: args.org,
            gist: args.gist,
            token: args.token
        }, function (err, org) {
            done(err, org);
        });
    },

    get: function (args, done) {
        Org.findOne({ orgId: args.orgId }, done);
    },

    getMultiple: function (args, done) {
        Org.find({ orgId: { $in: args.orgId } }, done);
    },

    remove: function (args, done) {
        Org.remove(args, done);
    }
};
