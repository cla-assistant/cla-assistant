require('../documents/org');
var mongoose = require('mongoose');
var Org = mongoose.model('Org');

// //services
// var github = require('../services/github');
// var logger = require('../services/logger');
// var url = require('../services/url');

// var isTransferredRenamed = function(dbOrg, ghOrg) {
//     return ghOrg.repoId === dbOrg.repoId && (ghOrg.repo !== dbOrg.repo || ghOrg.owner !== dbOrg.owner);
// };

// var compareOrgNameAndUpdate = function(dbOrg, ghOrg) {
//     if (isTransferredRenamed(dbOrg, ghOrg)) {
//         dbOrg.owner = ghOrg.owner;
//         dbOrg.repo = ghOrg.repo;
//         dbOrg.save();
//         return true;
//     } else {
//         return false;
//     }
// };

// var compareAllOrgs = function(ghOrgs, dbOrgs, done) {
//     dbOrgs.forEach(function(dbOrg){
//         ghOrgs.some(function(ghOrg){
//             return compareOrgNameAndUpdate(dbOrg, ghOrg);
//         });
//     });
//     done();
// };

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
        Org.findOne(args, done);
    },

    getMultiple: function (args, done) {
        Org.find({ orgId: { $in: args.orgId } }, done);
    },

    remove: function (args, done) {
        Org.remove(args, done);
    }
};
