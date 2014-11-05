// module
var github = require('../services/github');
var merge = require('merge');
var path = require('path');
// models
var User = require('mongoose').model('User');

module.exports = {

    /************************************************************************************************************

    @github

    + <req.obj>.<req.fun>

    ************************************************************************************************************/

    call: function(req, done) {
        github.call(merge(req.args, {
            token: req.user.token
        }), function(err, res, meta) {
            done(err, {
                data: res,
                meta: meta
            });

            // automatically add to users repo array
            // if(!err && req.args.obj === 'repos' && req.args.fun === 'get' && res.permissions && res.permissions.push) {

                // User.findOne({ uuid: req.user.id }, function(err, user) {
                //     if(!user)
                //     {
                //         user = new User({
                //             uuid: req.user.id,
                //             token: req.user.token
                //         });
                //     }
                //     user.save();
                //     // if(user) {
                //     //     var found = false;
                //     //     user.repos.forEach(function(repo) {
                //     //         if(repo === res.id) {
                //     //             found = true;
                //     //         }
                //     //     });

                //     //     if(!found) {
                //     //         user.repos.push(res.id);
                //     //         user.save();
                //     //     }
                //     // }
                // });
            // }
        });
    }
};
