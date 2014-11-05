var url = require('./url');
var github = require('./github');
var cla = require('./cla');
var repoService = require('./repo');

module.exports = {
    update: function(args, done) {

        var status = 'pending';
        var description = "You haven't sign our CLA yet. Please accept the CLA in order to get your pull request merged.";
        var token;

        repoService.get({repo: args.repo, owner: args.owner}, function(err, res){
            if (res && !err) {
                token = res.token;
            }

            cla.check({repo: args.repo, user: args.user}, function(err, claSigned){
                if (!err & claSigned) {
                    status = 'success';
                    description = 'CLA is accepted.';
                }

                github.call({
                    obj: 'statuses',
                    fun: 'create',
                    arg: {
                        user: args.owner,
                        repo: args.repo,
                        sha: args.sha,
                        state: status,
                        description: description,
                        target_url: url.claURL(args.owner, args.repo),
                        context: 'licence/clahub'
                    },
                    token: token
                }, null);
            });
        });
    }
};
