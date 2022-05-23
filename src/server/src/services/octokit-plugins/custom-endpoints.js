// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

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
