const App = require('@octokit/app').App;
const request = require('@octokit/request').request;
const logger = require('./logger');
const memCache = require('memory-cache');
const config = require('../../config');

const aDay = 1000 * 60 * 60 * 24;

class Installation {

    constructor(cache = memCache, app) {
        this.cache = cache;
        this.app = app || new App({
            id: config.server.github.appId,
            privateKey: (config.server.github.appPrivateKey || '').replace(/\\n/g, '\n')
        });
    }

    async getInstallationAccessToken(repo, owner) {
        try {
            const installationId = repo ? await this.getRepoInstallationId(repo, owner) : await this.getOrgInstallationId(owner);
            const token = await this.app.getInstallationAccessToken({ installationId });
            logger.trackEvent('Installation.getInstallationAccessToken.Success', { repo, owner });
            return token;
        } catch (err) {
            logger.trackEvent('Installation.getInstallationAccessToken.Failed', { repo, owner, msg: err.message });
        }
    }

    async getRepoInstallationId(repo, owner) {
        const key = `${owner}/${repo}`;
        const existing = this.cache.get(key);
        if (existing) {
            return existing;
        }
        const jwt = this.app.getSignedJsonWebToken();
        const { data } = await request('GET /repos/:owner/:repo/installation', {
            owner,
            repo,
            headers: {
                authorization: `Bearer ${jwt}`,
                accept: 'application/vnd.github.machine-man-preview+json',
            }
        });
        this.cache.put(key, data.id, aDay);
        return data.id;
    }

    async getOrgInstallationId(org) {
        const existing = this.cache.get(org);
        if (existing) {
            return existing;
        }
        const jwt = this.app.getSignedJsonWebToken();
        const { data } = await request('GET /orgs/:org/installation', {
            org,
            headers: {
                authorization: `Bearer ${jwt}`,
                accept: 'application/vnd.github.machine-man-preview+json',
            }
        });
        this.cache.put(org, data.id, aDay);
        return data.id;
    }
}

module.exports = new Installation();