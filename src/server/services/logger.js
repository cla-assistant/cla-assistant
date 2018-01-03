var raven = require('raven');
var bunyan = require('bunyan');
var BunyanSlack = require('bunyan-slack');
var SentryStream = require('bunyan-sentry-stream').SentryStream;

var client = new raven.Client(config.server.sentry_dsn);
var log;

var formatter = function (record, levelName) {
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
} catch (e) { }

try {
    log.addStream({
        name: 'sentry',
        level: 'warn',
        type: 'raw', // Mandatory type for SentryStream
        stream: new SentryStream(client)
    });
} catch (e) { }

module.exports = log;