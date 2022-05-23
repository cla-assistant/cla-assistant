// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

let http = require('http')

if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
}

/* eslint no-console: "off"*/
require('colors')
const async = require('async')
const express = require('express')
const glob = require('glob')
const merge = require('merge')
const passport = require('passport')
const path = require('path')
const cleanup = require('./middleware/cleanup')
const noSniff = require('dont-sniff-mimetype')
const mongoose = require('mongoose')
const rTracer = require('cls-rtracer')
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');

// var sass_middleware = require('node-sass-middleware');

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Load configuration
// ////////////////////////////////////////////////////////////////////////////////////////////////

global.config = require('./config')

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Express application
// ////////////////////////////////////////////////////////////////////////////////////////////////

const log = require('./services/logger')

const app = express()
const api = {}
const webhooks = {}
let runningWebhooks = []

// install tracing middleware
const tracingOptions = {}
if (config.server.observability.request_trace_header_name) {
    tracingOptions.useHeader = true
    tracingOptions.headerName = config.server.observability.request_trace_header_name
}
app.use(rTracer.expressMiddleware(tracingOptions))

// redirect from http to https
app.use((req, res, next) => {
    if (!req.headers['x-forwarded-proto'] || req.headers['x-forwarded-proto'] === 'https') {
        next();

        return
    }
    let host = req.headers['x-forwarded-host'] || req.headers.host;

    res.setHeader('location', 'https://' + host + req.url);
    res.statusCode = 301;
    res.end();
});

app.use(require('x-frame-options')());
app.use(require('body-parser').json({
    limit: '5mb'
}));
app.use(require('cookie-parser')());
app.use(noSniff());
app.enable('trust proxy');

// custom mrepodleware
app.use('/api', require('./middleware/param'))
app.use('/github', require('./middleware/param'))
app.use('/accept', require('./middleware/param'))
app.use('/count', require('./middleware/param'))

const bootstrap = (files, callback) => {
    console.log('bootstrap'.bold, files.bold);

    async.eachSeries(config.server[files], (p, cb) => {
        glob(p, (err, file) => {
            if (err) {
                console.log('✖ '.bold.red + err)
            }
            if (file && file.length) {
                file.forEach((f) => {
                    try {
                        if (files === 'api') {
                            api[path.basename(f, '.js')] = require(f);
                        } else if (files === 'passport') {
                            require(f);
                        } else if (files === 'plugins') {
                            global.plugins[path.basename(f, '.js')] = require(f);
                        } else if (files === 'controller') {
                            app.use('/', require(f));
                        } else if (files === 'graphQueries') {
                            require(f);
                        } else if (files === 'documents') {
                            global.models = merge(global.models, require(f));
                        } else if (files === 'webhooks') {
                            webhooks[path.basename(f, '.js')] = require(f);
                        }
                    } catch (ex) {
                        console.log('✖ '.bold.red + path.relative(process.cwd(), f))
                        console.log(ex.stack)

                        return
                    }
                    console.log('✓ '.bold.green + path.relative(process.cwd(), f))
                });
            }
            cb()
        });
    }, callback)
};

async.series([

    (callback) => {
        console.log('checking configs'.bold)

        function validateProtocol(protocol, msg) {
            if (config.server[protocol].protocol !== 'http' && config.server[protocol].protocol !== 'https') {
                throw new Error(msg + ' must be "http" or "https"')
            }
        }
        validateProtocol('http', 'PROTOCOL')
        validateProtocol('github', 'GITHUB_PROTOCOL')

        console.log('✓ '.bold.green + 'configs seem ok')

        let url = require('./services/url')

        console.log('Host:        ' + url.baseUrl)
        console.log('GitHub:      ' + url.githubBase)
        console.log('GitHub-Api:  ' + url.githubApiBase)
        callback();
    },

    (callback) => {
        console.log('bootstrap static files'.bold)

        config.server.static.forEach((p) => {
            app.use(p.prefix, express.static(p.path))
        })
        callback()
    },

    // ////////////////////////////////////////////////////////////////////////////////////////////
    // Bootstrap mongoose
    // ////////////////////////////////////////////////////////////////////////////////////////////

    (callback) => {
        retryInitializeMongoose(config.server.mongodb.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            keepAlive: true
        }, () => {
            bootstrap('documents', callback);
        })
        const session = {
            secret: config.server.security.sessionSecret,
            saveUninitialized: true,
            resave: false,
            cookie: {
                maxAge: config.server.security.cookieMaxAge
            },
            // cosmosDB supports only supports autoExpire on _ts fields
            // therefore use interval based removal to workaround that
            store: MongoStore.create({
                client: mongoose.connection.getClient(),
                collection: 'cookieSession',
                ttl: config.server.security.cookieMaxAge,
                autoRemove: 'interval',
                autoRemoveInterval: 10, // Value in minutes (default is 10)
            })
        }
        session.cookie.secure = app.get('env') === 'production'

        app.use(expressSession(session))
        app.use(passport.initialize())
        app.use(passport.session())

        global.models = {}
    },
    (callback) => {
        bootstrap('webhooks', callback)
    },

    (callback) => {
        bootstrap('passport', callback)
    },
    (callback) => {
        bootstrap('graphQueries', callback)
    },

    (callback) => {
        bootstrap('api', callback)
    },

    (callback) => {
        bootstrap('controller', callback)
    }
], (err) => {
    if (err) {
        console.log('! '.yellow + err)
    }


    console.log(`${'\n✓ '.bold.green}bootstrapped for ${app.get('env')}, app listening on ${config.server.http.host}:${config.server.localport}`.bold)
    log.info(`✓ bootstrapped for ${app.get('env')}!!! App listening on ${config.server.http.host}:${config.server.http.port}`)
    // eslint-disable-next-line no-console
    console.log('App is initialized')
    let server = http.createServer(app)
    // eslint-disable-next-line no-console
    console.log('Server is created')
    const listener = server.listen(config.server.localport, function () {
        // eslint-disable-next-line no-console
        console.log('Listening on port ' + listener.address().port)
    });
});

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Handle api calls
// ////////////////////////////////////////////////////////////////////////////////////////////////
app.use('/api', require('./middleware/authenticated'))


app.all('/api/:obj/:fun', async (req, res) => {
    res.set('Content-Type', 'application/json');

    const apiSuccess = (obj) => {
        if (obj !== undefined && obj !== null) {
            obj = cleanup.cleanObject(obj)
            res.send(JSON.stringify(obj))
        } else {
            res.send()
        }
    }

    const apiFailure = (err) => {
        if (err && typeof err === 'string') {
            res.status(500).send(err)
        } else if (err) {
            return res.status(err.status > 0 ? err.status : 500).send(JSON.stringify(err.text || err.message || err))
        }
    }
    try {
        const obj = await api[req.params.obj][req.params.fun](req)
        apiSuccess(obj)
    } catch (err) {
        apiFailure(err)
    }
});

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Handle webhook calls
// ////////////////////////////////////////////////////////////////////////////////////////////////

app.all('/github/webhook/:repo', (req, res) => {
    let event = req.headers['x-github-event']
    try {
        let hook = webhooks[event]
        if (!hook) {
            return res.status(400).send('Unsupported event')
        }
        if (hook.accepts(req)) {
            if (isRudundantWebhook(req)) {
                console.log(`Skip redundant webhook for the PR ${req.args.pull_request.html_url} on PR action "${req.args.action}"`)
                return res.status(202).send('This seems to be a redundant webhook. Probably there are two webhooks registered: org- and repo-webhook')
            }
            return hook.handle(req, res)
        }
        return res.status(204).send('This webhook performed no action')
    } catch (err) {
        res.status(500).send('Internal Server Error')
    }
})

function isRudundantWebhook(req) {
    if (req.args.pull_request && req.args.pull_request.html_url) {
        if (runningWebhooks.indexOf(req.args.pull_request.html_url) >= 0) {
            return true
        }
        runningWebhooks.push(req.args.pull_request.html_url)
        setTimeout(() => {
            runningWebhooks = runningWebhooks.filter(e => e !== req.args.pull_request.html_url)
        }, 2000)
    }
}

function retryInitializeMongoose(uri, options, callback) {
    const defaultInterval = 1000;
    mongoose.connect(uri, options, err => {
        if (err) {
            console.log(err, `Retry initialize mongoose in ${options.retryInitializeInterval || defaultInterval} milliseconds`);
            setTimeout(() => {
                retryInitializeMongoose(uri, options);
            }, options.retryInitializeInterval || defaultInterval);
        }
        if (typeof callback === 'function') {
            callback()
        }
    })
}

module.exports = app
