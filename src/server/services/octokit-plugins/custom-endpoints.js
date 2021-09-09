// custom endpoints for Octokit
function repoGetById (octokit) {
    return {
        repo: {
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
        }
    }

}

module.exports = {
    repoGetById,
}
