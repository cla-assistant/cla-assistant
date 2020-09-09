var env = process.env;

console.log("setup proxy to: ", env["http_proxy"], env["HTTP_PROXY"]);

if (!env["http_proxy"] && !env["HTTP_PROXY"]) return;

var localUrls = ["http://some-internal-url.mycompany.local"];

var url = require("url");
var tunnel = require("tunnel");
var proxy = url.parse(env["http_proxy"] || env["HTTP_PROXY"]);

console.log("proxy set to:", proxy);

var tunnelingAgent = tunnel.httpsOverHttp({
  proxy: {
    host: proxy.hostname,
    port: proxy.port,
  },
});

var https = require("https");
var http = require("http");

var oldhttpsreq = https.request;
https.request = function (options, callback) {
  if (
    localUrls.some(function (u) {
      return ~u.indexOf(options.host);
    })
  ) {
    return oldhttpsreq.apply(https, arguments);
  }

  options.agent = tunnelingAgent;
  return oldhttpsreq.call(null, options, callback);
};

var oldhttpreq = http.request;
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
