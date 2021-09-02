const bunyan = require('bunyan')
const BunyanSlack = require('bunyan-slack')
const rTracer = require('cls-rtracer')

const formatter = (record, levelName) => {
    return {
        text: `[${levelName}] ${record.msg} (source: ${record.src.file} line: ${record.src.line})`
    }
}

// we use a custom Stdout writer, which injects for each call the request id
const wrappedStdout = {
        write: entry => {
            const logObject = JSON.parse(entry)
            logObject[config.server.observability.log_trace_field_name] = rTracer.id();
            process.stdout.write(JSON.stringify(logObject) + '\n');
        }
}

const log = bunyan.createLogger({
    src: true,
    name: config.server.http.host,
    streams: [{
        name: 'stdout',
        level: process.env.ENV == 'debug' ? 'info' : 'debug',
        stream: wrappedStdout,
    }]
});

try {
    if (config.server.slack.url) {
        log.addStream({
            name: 'slack',
            level: 'error',
            stream: new BunyanSlack({
                webhook_url: config.server.slack.url,
                channel: config.server.slack.channel,
                username: 'CLA Assistant',
                customFormatter: formatter
            })
        })
    }
} catch (e) {
    log.info(e)
}

module.exports = log
