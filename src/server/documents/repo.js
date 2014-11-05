var mongoose = require('mongoose');

var RepoSchema = mongoose.Schema({
    uuid: Number,
    repo: String,
    owner: String,
    gist: String,
    token: String
});

RepoSchema.index({
    repo: 1,
    owner: 1
}, {
    unique: true
});

var Repo = mongoose.model('Repo', RepoSchema);

module.exports = {
    Repo: Repo
};
