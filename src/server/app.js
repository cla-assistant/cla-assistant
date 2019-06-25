/* eslint no-console: "off"*/
require('colors')
const async = require('async')
const express = require('express')
const glob = require('glob')
const merge = require('merge')
const passport = require('passport')
const path = require('path')
const sass_middleware = require('node-sass-middleware')
const cleanup = require('./middleware/cleanup')
const noSniff = require('dont-sniff-mimetype')
const mongoose = require('mongoose')
// var sass_middleware = require('node-sass-middleware');

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Load configuration
// ////////////////////////////////////////////////////////////////////////////////////////////////

global.config = require('./../config')

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Express application
// ////////////////////////////////////////////////////////////////////////////////////////////////

const app = express()
const api = {}
const webhooks = {}

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
app.use(require('body-parser').json({ limit: '5mb' }));
app.use(require('cookie-parser')());
app.use(noSniff());
app.enable('trust proxy');
let expressSession = require('express-session');
let MongoStore = require('connect-mongo')(expressSession);

// custom mrepodleware
app.use('/api', require('./middleware/param'))
app.use('/github', require('./middleware/param'))
app.use('/accept', require('./middleware/param'))
app.use('/count', require('./middleware/param'))

// app.use(function (err, req, res, next) {
//     var log = require('./services/logger');
//     log.info('app error: ', err.stack);
// });

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
            app.use(sass_middleware({
                src: p,
                dest: p,
                outputStyle: 'compressed',
                force: config.server.always_recompile_sass
            }))
            app.use(express.static(p))
        })
        callback()
    },

    // ////////////////////////////////////////////////////////////////////////////////////////////
    // Bootstrap mongoose
    // ////////////////////////////////////////////////////////////////////////////////////////////

    (callback) => {
        retryInitializeMongoose(config.server.mongodb.uri, {
            useNewUrlParser: true,
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
            store: new MongoStore({
                mongooseConnection: mongoose.connection,
                collection: 'cookieSession'
            })
        }
        session.cookie.secure = app.get('env') === 'production'

        app.use(expressSession(session))
        app.use(passport.initialize())
        app.use(passport.session())

        global.models = {}
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
        bootstrap('webhooks', callback)
    },

    (callback) => {
        bootstrap('controller', callback)
    }
], (err) => {
    if (err) {
        console.log('! '.yellow + err)
    }
    const log = require('./services/logger')

    console.log(`${'\n✓ '.bold.green}bootstrapped for ${app.get('env')}, app listening on ${config.server.http.host}:${config.server.localport}`.bold)
    log.info(`✓ bootstrapped for ${app.get('env')}!!! App listening on ${config.server.http.host}:${config.server.http.port}`)
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
            return res.status(err.code > 0 ? err.code : 500).send(JSON.stringify(err.text || err.message || err))
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
        if (!webhooks[event]) {
            return res.status(400).send('Unsupported event')
        }
        webhooks[event](req, res)
    } catch (err) {
        res.status(500).send('Internal Server Error')
    }
})

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
// async function retryInitializeMongoose(uri, options) {
//     const defaultInterval = 1000
//     try {
//         await mongoose.connect(uri, options);
//     } catch (err) {
//         console.log(err, `Retry initialize mongoose in ${options.retryInitializeInterval || defaultInterval} milliseconds`)
//         setTimeout(() => {
//             retryInitializeMongoose(uri, options)
//         }, options.retryInitializeInterval || defaultInterval)

//     }
// }