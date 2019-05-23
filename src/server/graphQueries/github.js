
module.exports = {
    getPRCommitters: (owner, repo, number, cursor) => {
        number = typeof number === 'string' ? parseInt(number) : number
        let query = `
            query($owner:String! $name:String! $number:Int! $cursor:String!){
                repository(owner: $owner, name: $name) {
                pullRequest(number: $number) {
                    commits(first: 100, after: $cursor) {
                        totalCount
                        edges {
                            node {
                                commit {
                                    author {
                                        email
                                        name
                                        user {
                                            id
                                            databaseId
                                            login
                                        }
                                    }
                                    committer {
                                        name
                                        user {
                                            id
                                            databaseId
                                            login
                                        }
                                    }
                                }
                            }
                            cursor
                        }
                        pageInfo {
                            endCursor
                            hasNextPage
                        }
                    }
                }
            }
        }`.replace(/ /g, '')
        let variables = {
            owner: owner,
            name: repo,
            number: number,
            cursor: cursor
        }

        return JSON.stringify({ query, variables })
    },

    getUserOrgs: (owner, cursor) => {
        let query = `query ($owner: String! ${cursor ? '$cursor: String!)' : ')'} {`
        query = query + `
            user(login: $owner) {
                organizations(first: 100${cursor ? ', after: $cursor' : ''}) {
                    edges {
                        cursor
                        node {
                            login
                            name
                            id
                            databaseId
                            avatarUrl
                            viewerCanAdminister
                        }
                    }
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                }
            }
        }`
        let variables = { owner }
        if (cursor) {
            variables.cursor = cursor
        }

        return JSON.stringify({ query, variables }).replace(/ /g, '')
    }
}