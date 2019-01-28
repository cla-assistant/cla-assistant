/**
 * Configuration Module
 *
 * @title config
 * @overview Configuration Module
 */
let path = require('path');

module.exports = {
    server: {
        github: {
            // optional
            protocol: process.env.GITHUB_PROTOCOL || 'https',
            host: process.env.GITHUB_HOST || 'github.com',
            api: process.env.GITHUB_API_HOST || 'api.github.com',
            enterprise: !!process.env.GITHUB_HOST, // flag enterprise version
            version: process.env.GITHUB_VERSION || '3.0.0',

            graphqlEndpoint: process.env.GITHUB_GRAPHQL || 'https://api.github.com/graphql',

            // required
            client: process.env.GITHUB_CLIENT,
            secret: process.env.GITHUB_SECRET,

            // required
            user: process.env.GITHUB_USER,
            pass: process.env.GITHUB_PASS,
            admin_users: process.env.GITHUB_ADMIN_USERS ? process.env.GITHUB_ADMIN_USERS.split(/\s*,\s*/) : [],

            // required
            token: process.env.GITHUB_TOKEN,

            user_scope: ['user:email'],
            admin_scope: ['user:email', 'public_repo', 'repo:status', 'read:repo_hook', 'write:repo_hook', 'read:org', 'gist'],

            commit_bots: ['web-flow'],

            //delay reaction on webhook
            enforceDelay: parseInt(process.env.GITHUB_DELAY || '5000', 10),

            //slow down API calls in order to avoid abuse rate limit
            timeToWait: process.env.GITHUB_TIME_TO_WAIT || 1000
        },

        localport: process.env.PORT || 5000,

        always_recompile_sass: process.env.NODE_ENV === 'production' ? false : true,

        cache_time: process.env.CACHE_TIME || 5,

        http: {
            protocol: process.env.PROTOCOL || 'http',
            host: process.env.HOST || 'cla-assistant.io',
            port: process.env.HOST_PORT
        },

        security: {
            sessionSecret: process.env.SESSION_SECRET || 'cla-assistant',
            cookieMaxAge: 60 * 60 * 1000
        },

        smtp: {
            enabled: !!process.env.SMTP_HOST,
            host: process.env.SMTP_HOST,
            secure: (!!process.env.SMTP_SSL && process.env.SMTP_SSL === 'true'),
            port: process.env.SMTP_PORT || 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            name: 'cla-assistant'
        },

        mongodb: {
            uri: process.env.MONGODB || process.env.MONGOLAB_URI
        },

        slack: {
            url: process.env.SLACK_URL,
            channel: process.env.SLACK_CHANNEL
        },

        templates: {
            login: process.env.LOGIN_PAGE_TEMPLATE || path.join(__dirname, 'client', 'login.html')
        },

        sentry_dsn: process.env.SENTRY_DSN,

        api_access: {
            free: ['/api/cla/get', '/api/cla/getLinkedItem'],
            external: ['/api/cla/getAll'],
            admin_only: [
                '/api/cla/addSignature',
                '/api/cla/hasSignature',
                '/api/cla/terminateSignature',
                '/api/cla/validate',
                '/api/cla/getGist',
                '/api/org/create',
                '/api/org/remove',
                '/api/repo/create',
                '/api/repo/remove'
            ]
        },

        feature_flag: {
            required_signees: process.env.REQUIRED_SIGNEES || '',
            organization_override_enabled: process.env.ORG_OVERRIDE_ENABLED || false,
        },

        static: [
            path.join(__dirname, 'bower'),
            path.join(__dirname, 'client')
        ],

        api: [
            path.join(__dirname, 'server', 'api', '*.js')
        ],

        webhooks: [
            path.join(__dirname, 'server', 'webhooks', '*.js')
        ],

        documents: [
            path.join(__dirname, 'server', 'documents', '*.js')
        ],

        controller: [
            path.join(__dirname, 'server', 'controller', '!(default).js'),
            path.join(__dirname, 'server', 'controller', 'default.js')
        ],

        graphQueries: [
            path.join(__dirname, 'server', 'graphQueries', '*.js')
        ],

        middleware: [
            path.join(__dirname, 'server', 'middleware', '*.js')
        ],

        passport: [
            path.join(__dirname, 'server', 'passports', '*.js')
        ],

    }
};