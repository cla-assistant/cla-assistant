var org = require('../services/org');

module.exports = {

    // check: function(req, done) {
    //     org.check(req.args, done);
    // },
    create: function(req, done){
        req.args.token = req.user.token;
        org.create(req.args, done);
    },
    // getAll: function(req, done){
    //     org.getAll(req.args, function(err, orgs){
    //         if (err) {
    //             log.error(err);
    //         }
    //         done(err, orgs);
    //     });
    // },
    // update: function(req, done){
    //     org.update(req.args, done);
    // },
    remove: function(req, done){
        org.remove(req.args, done);
    }
};
