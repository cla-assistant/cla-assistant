const bunyan = require('bunyan')
const BunyanSlack = require('bunyan-slack')
let log

const formatter = (record, levelName) => {
    return {
        text: `[${levelName}] ${record.msg} (source: ${record.src.file} line: ${record.src.line})`
    }
}

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
    })
} catch (e) {
    log.info(e)
}

module.exports = log