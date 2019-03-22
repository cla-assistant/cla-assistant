/* eslint no-console: "off"*/
require('colors');
let async = require('async');
let express = require('express');
let glob = require('glob');
let merge = require('merge');
let passport = require('passport');
let path = require('path');
let sass_middleware = require('node-sass-middleware');
let cleanup = require('./middleware/cleanup');
let noSniff = require('dont-sniff-mimetype');
let mongoose = require('mongoose');
// var sass_middleware = require('node-sass-middleware');

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Load configuration
// ////////////////////////////////////////////////////////////////////////////////////////////////

global.config = require('./../config');

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Express application
// ////////////////////////////////////////////////////////////////////////////////////////////////

let app = express();
let api = {};
let webhooks = {};

// redirect from http to https
app.use(function (req, res, next) {
    if (!req.headers['x-forwarded-proto'] || req.headers['x-forwarded-proto'] === 'https') {
        next();

        return;
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
let expressSession = require('express-session');
let MongoStore = require('connect-mongo')(expressSession);

// custom mrepodleware
app.use('/api', require('./middleware/param'));
app.use('/github', require('./middleware/param'));
app.use('/accept', require('./middleware/param'));
app.use('/count', require('./middleware/param'));

// app.use(function (err, req, res, next) {
//     var log = require('./services/logger');
//     log.info('app error: ', err.stack);
// });

let bootstrap = function (files, callback) {
    console.log('bootstrap'.bold, files.bold);

    async.eachSeries(config.server[files], function (p, cb) {
        glob(p, function (err, file) {
            if (err) {
                console.log('✖ '.bold.red + err);
            }
            if (file && file.length) {
                file.forEach(function (f) {
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
                        console.log('✖ '.bold.red + path.relative(process.cwd(), f));
                        console.log(ex.stack);

                        return;
                    }
                    console.log('✓ '.bold.green + path.relative(process.cwd(), f));
                });
            }
            cb();
        });
    }, callback);
};

async.series([

    function (callback) {
        console.log('checking configs'.bold);

        function validateProtocol(protocol, msg) {
            if (config.server[protocol].protocol !== 'http' && config.server[protocol].protocol !== 'https') {
                throw new Error(msg + ' must be "http" or "https"');
            }
        }
        validateProtocol('http', 'PROTOCOL');
        validateProtocol('github', 'GITHUB_PROTOCOL');

        console.log('✓ '.bold.green + 'configs seem ok');

        let url = require('./services/url');

        console.log('Host:        ' + url.baseUrl);
        console.log('GitHub:      ' + url.githubBase);
        console.log('GitHub-Api:  ' + url.githubApiBase);
        callback();
    },

    function (callback) {
        console.log('bootstrap static files'.bold);

        config.server.static.forEach(function (p) {
            app.use(sass_middleware({
                src: p,
                dest: p,
                outputStyle: 'compressed',
                force: config.server.always_recompile_sass
            }));
            app.use(express.static(p));
        });
        callback();
    },

    // ////////////////////////////////////////////////////////////////////////////////////////////
    // Bootstrap mongoose
    // ////////////////////////////////////////////////////////////////////////////////////////////

    function (callback) {
        retryInitializeMongoose(config.server.mongodb.uri, {
            useNewUrlParser: true,
            keepAlive: true
        }, () => {
            bootstrap('documents', callback);
        });

        app.use(expressSession({
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
        }));
        app.use(passport.initialize());
        app.use(passport.session());

        global.models = {};
    },

    function (callback) {
        bootstrap('passport', callback);
    },

    function (callback) {
        bootstrap('controller', callback);
    },

    function (callback) {
        bootstrap('graphQueries', callback);
    },

    function (callback) {
        bootstrap('api', callback);
    },

    function (callback) {
        bootstrap('webhooks', callback);
    }
], function (err) {
    if (err) {
        console.log('! '.yellow + err);
    }
    let log = require('./services/logger');

    console.log('\n✓ '.bold.green + 'bootstrapped, '.bold + 'app listening on ' + config.server.http.host + ':' + config.server.localport);
    log.info('✓ bootstrapped !!! App listening on ' + config.server.http.host + ':' + config.server.http.port);
});

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Handle api calls
// ////////////////////////////////////////////////////////////////////////////////////////////////
app.use('/api', require('./middleware/authenticated'));


app.all('/api/:obj/:fun', function (req, res) {
    res.set('Content-Type', 'application/json');
    function apiSuccess(obj) {
        if (obj !== undefined && obj !== null) {
            obj = cleanup.cleanObject(obj);
            res.send(JSON.stringify(obj));
        } else {
            res.send();
        }
    }
    function apiFailure(err) {
        if (err && typeof err === 'string') {
            return res.status(500).send(err);
        } else if (err) {
            return res.status(err.code > 0 ? err.code : 500).send(JSON.stringify(err.text || err.message || err));
        }
    }

    const promise = api[req.params.obj][req.params.fun](req, function (err, obj) {
        return err ? apiFailure(err) : apiSuccess(obj);
    });
    if (promise) {
        promise.then(apiSuccess, apiFailure);
    }
});

// ////////////////////////////////////////////////////////////////////////////////////////////////
// Handle webhook calls
// ////////////////////////////////////////////////////////////////////////////////////////////////

app.all('/github/webhook/:repo', function (req, res) {
    let event = req.headers['x-github-event'];
    try {
        if (!webhooks[event]) {
            return res.status(400).send('Unsupported event');
        }
        webhooks[event](req, res);
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

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
            callback();
        }
    });
}

module.exports = app;