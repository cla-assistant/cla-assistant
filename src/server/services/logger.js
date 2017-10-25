let raven = require('raven');
let appInsights = require('applicationinsights');
let bunyan = require('bunyan');
let BunyanSlack = require('bunyan-slack');
let SentryStream = require('bunyan-sentry-stream').SentryStream;

let client = new raven.Client(config.server.sentry_dsn);
let log;

let formatter = function (record, levelName) {
    return {
        text: '[' + levelName + '] ' + record.msg + ' (source: ' + record.src.file + ' line: ' + record.src.line + ')'
    };
};

log = bunyan.createLogger({
    src: true,
    name: config.server.http.host,
    streams: [{
        name: 'stdout',
        level: process.env.ENV == 'debug' ? 'info' : 'debug',
        stream: process.stdout
    }]
});

if (config.server.appInsights) {
    appInsights.setup(config.server.appInsights)
        .setAutoCollectConsole(true)
        .setAutoCollectDependencies(false)
        .start();
    log.trackEvent = function (name, properties, measurements) {
        return appInsights.defaultClient.trackEvent({ name, properties, measurements });
    };
} else {
    log.trackEvent = function (name, properties, measurements) {
        log.info({ name, properties, measurements });
    };
}

try {
    log.addStream({
        name: 'slack',
        level: 'error',
        stream: new BunyanSlack({
            webhook_url: config.server.slack.url,
            channel: config.server.slack.channel,
            username: 'CLA Assistant',
            customFormatter: formatter
        })
    });
} catch (e) {
    log.info(e);
}

try {
    log.addStream({
        name: 'sentry',
        level: 'warn',
        type: 'raw', // Mandatory type for SentryStream
        stream: new SentryStream(client)
    });
} catch (e) {
    log.info(e);
}

module.exports = log;