// custom endpoints for Octokit
function reposGetById(octokit) {
    Object.assign(octokit.repos, {
        getById: octokit.request.defaults({
            method: 'GET',
            url: '/repositories/:id',
            params: {
                id: {
                    type: 'string',
                    required: true,
                }
            }
        })
    })
}

module.exports = {
    reposGetById,
}
