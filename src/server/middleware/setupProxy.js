const env = process.env;

if (!env["HTTP_PROXY"]) return;

const localUrls = ["http://some-internal-url.mycompany.local"];

const url = require("url");
const tunnel = require("tunnel");

const proxy = url.parse(env["HTTP_PROXY"]);
const proxySSL = url.parse(env["HTTPS_PROXY"]);

console.log("proxy set to:", proxy);

// https tunnel
const https = require("https");
const oldhttpsreq = https.request;
const tunnelingAgentSSL = tunnel.httpsOverHttps({
  proxy: {
    host: proxySSL.hostname,
    port: proxySSL.port,
  },
});
https.request = function (options, callback) {
  if (
    localUrls.some(function (u) {
      return ~u.indexOf(options.host);
    })
  ) {
    return oldhttpsreq.apply(https, arguments);
  }

  options.agent = tunnelingAgentSSL;
  return oldhttpsreq.call(null, options, callback);
};

// http tunnel
const http = require("http");
const oldhttpreq = http.request;
const tunnelingAgent = tunnel.httpsOverHttp({
  proxy: {
    host: proxy.hostname,
    port: proxy.port,
  },
});
http.request = function (options, callback) {
  if (
    localUrls.some(function (u) {
      return ~u.indexOf(options.host);
    })
  ) {
    return oldhttpreq.apply(http, arguments);
  }

  options.agent = tunnelingAgent;
  return oldhttpreq.call(null, options, callback);
};
