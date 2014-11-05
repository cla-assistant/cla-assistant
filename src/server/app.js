var async = require('async');
var colors = require('colors');
var express = require('express');
var glob = require('glob');
var merge = require('merge');
var passport = require('passport');
var path = require('path');
var sass = require('node-sass');

//////////////////////////////////////////////////////////////////////////////////////////////////
// Load configuration
//////////////////////////////////////////////////////////////////////////////////////////////////

global.config = require('./../config');

//////////////////////////////////////////////////////////////////////////////////////////////////
// Express application
//////////////////////////////////////////////////////////////////////////////////////////////////

var app = express();
var api = {};
var webhooks = {};

app.use(require('body-parser').json());
app.use(require('cookie-parser')());
app.use(require('cookie-session')({
    secret: config.server.security.sessionSecret,
    cookie: {
        maxAge: config.server.security.cookieMaxAge
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// custom mrepodleware
app.use('/api', require('./middleware/param'));
app.use('/github', require('./middleware/param'));
app.use('/accept', require('./middleware/param'));

async.series([

    function(callback) {
        console.log('checking configs'.bold);

        if(config.server.http.protocol !== 'http' && config.server.http.protocol !== 'https') {
            throw new Error('PROTOCOL must be "http" or "https"');
        }

        if(config.server.github.protocol !== 'http' && config.server.github.protocol !== 'https') {
            throw new Error('GITHUB_PROTOCOL must be "http" or "https"');
        }

        console.log('✓ '.bold.green + 'configs seem ok');

        var url = require('./services/url');

        console.log('Host:        ' + url.baseUrl);
        console.log('GitHub:      ' + url.githubBase);
        console.log('GitHub-Api:  ' + url.githubApiBase);
        callback();
    },

    function(callback) {

        console.log('bootstrap static files'.bold);

        config.server.static.forEach(function(p) {
            app.use(sass.middleware({
                src: p,
                dest: p,
                outputStyle: 'compressed',
                force: config.server.always_recompile_sass
            }));
            app.use(express.static(p));
        });
        callback();
    },

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Bootstrap mongoose
    //////////////////////////////////////////////////////////////////////////////////////////////

    function(callback) {

        console.log('bootstrap mongoose'.bold);

        var mongoose = require('mongoose');

        mongoose.connect(config.server.mongodb.uri, {
            server: {
                socketOptions: {
                    keepAlive: 1
                }
            }
        });

        global.models = {};

        async.eachSeries(config.server.documents, function(p, callback) {
            glob(p, function(err, file) {
                if (file && file.length) {
                    file.forEach(function(f) {
                        try {
                            global.models = merge(global.models, require(f));
                            console.log('✓ '.bold.green + path.relative(process.cwd(), f));
                        } catch (ex) {
                            console.log('✖ '.bold.red + path.relative(process.cwd(), f));
                            console.log(ex.stack);
                        }
                    });
                    callback();
                }
            });
        }, callback);
    },

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Bootstrap passport
    //////////////////////////////////////////////////////////////////////////////////////////////

    function(callback) {

        console.log('bootstrap passport'.bold);

        async.eachSeries(config.server.passport, function(p, callback) {
            glob(p, function(err, file) {
                if (file && file.length) {
                    file.forEach(function(f) {
                        console.log('✓ '.bold.green + path.relative(process.cwd(), f));
                        require(f);
                    });
                }
                callback();
            });
        }, callback);
    },

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Bootstrap controller
    //////////////////////////////////////////////////////////////////////////////////////////////

    function(callback) {

        console.log('bootstrap controller'.bold);

        async.eachSeries(config.server.controller, function(p, callback) {
            glob(p, function(err, file) {
                if (file && file.length) {
                    file.forEach(function(f) {
                        try {
                            app.use('/', require(f));
                            console.log('✓ '.bold.green + path.relative(process.cwd(), f));
                        } catch (ex) {
                            console.log('✖ '.bold.red + path.relative(process.cwd(), f));
                            console.log(ex.stack);
                        }
                    });
                }
                callback();
            });
        }, callback);
    },

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Bootstrap api
    //////////////////////////////////////////////////////////////////////////////////////////////

    function(callback) {

        console.log('bootstrap api'.bold);

        async.eachSeries(config.server.api, function(p, callback) {
            glob(p, function(err, file) {
                if (file && file.length) {
                    file.forEach(function(f) {
                        console.log('✓ '.bold.green + path.relative(process.cwd(), f));
                        api[path.basename(f, '.js')] = require(f);
                    });
                }
                callback();
            });
        }, callback);
    },

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Bootstrap webhooks
    //////////////////////////////////////////////////////////////////////////////////////////////

    function(callback) {

        console.log('bootstrap webhooks'.bold);

        async.eachSeries(config.server.webhooks, function(p, callback) {
            glob(p, function(err, file) {
                if (file && file.length) {
                    file.forEach(function(f) {
                        console.log('✓ '.bold.green + path.relative(process.cwd(), f));
                        webhooks[path.basename(f, '.js')] = require(f);
                    });
                }
                callback();
            });
        }, callback);
    }

], function(err, res) {
    console.log('\n✓ '.bold.green + 'bootstrapped, '.bold + 'app listening on localhost:' + config.server.localport);
});

//////////////////////////////////////////////////////////////////////////////////////////////////
// Handle api calls
//////////////////////////////////////////////////////////////////////////////////////////////////
app.all('/api/cla/get', function(req, res) {
    res.set('Content-Type', 'application/json');
    api.cla.get(req, function(err, obj) {
        if(err) {
            return res.status(err.code > 0 ? err.code : 500).send(JSON.stringify(err.text || err));
            // return res.send(err.code > 0 ? err.code : 500, JSON.stringify(err.text || err));
        }
        obj ? res.send(JSON.stringify(obj)) : res.send();
    });
});

app.all('/api/repo/check', function(req, res) {
    res.set('Content-Type', 'application/json');
    api.repo.check(req, function(err, obj) {
        if(err) {
            return res.status(err.code > 0 ? err.code : 500).send(JSON.stringify(err.text || err));
            // return res.send(err.code > 0 ? err.code : 500, JSON.stringify(err.text || err));
        }
        obj ? res.send(JSON.stringify(obj)) : res.send();
    });
});

app.use('/api', require('./middleware/authenticated'));

app.all('/api/:obj/:fun', function(req, res) {
    res.set('Content-Type', 'application/json');
    api[req.params.obj][req.params.fun](req, function(err, obj) {
        if(err) {
            return res.status(err.code > 0 ? err.code : 500).send(JSON.stringify(err.text || err));
            // return res.send(err.code > 0 ? err.code : 500, JSON.stringify(err.text || err));
        }
        obj ? res.send(JSON.stringify(obj)) : res.send();
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////
// Handle webhook calls
//////////////////////////////////////////////////////////////////////////////////////////////////

app.all('/github/webhook/:repo', function(req, res) {
    var event = req.headers['x-github-event'];
    console.log('event ', event);
    try {
        if (!webhooks[event]) {
            return res.send(400, 'Unsupported event');
        }
        webhooks[event](req, res);
    } catch (err) {
        res.send(500, 'Internal Server Error');
    }
});

module.exports = app;
