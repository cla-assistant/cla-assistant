var bunyan = require('bunyan');
var BunyanSlack = require('bunyan-slack');
var log;

try{
	log = bunyan.createLogger({
		src: true,
		name: config.server.http.host,
		streams: [{
			path: 'log'
		},
		{
			level: 'error',
			stream: new BunyanSlack({
				webhook_url: config.server.slack_url,
				channel: '#cla-assistant',
				username: 'CLA assistant'
			})
		},
		{
			level: 'warn',
			stream: new BunyanSlack({
				webhook_url: config.server.slack_url,
				channel: '@kharitonov',
				username: 'CLA assistant'
			})
		}

		]
	});

	// log.warn('hello form bunyan to slack');
} catch (e) {
	log = bunyan.createLogger({
		src: true,
		name: config.server.http.host,
		streams: [{
			path: 'log'
		}]
	});
}

module.exports = log;
