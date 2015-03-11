var bunyan = require('bunyan');
var log = bunyan.createLogger({
	src: true,
	name: config.server.http.host,
	streams: [{
		path: 'log'
	}]
});

module.exports = log;
