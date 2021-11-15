'use strict';

// *****************************************************
// API
// *****************************************************

function ResultSet() {

    this.loaded = false;
    this.loading = true;

}

ResultSet.prototype.set = function (error, value) {

    this.loaded = true;
    this.loading = false;

    this.error = error;
    this.affix = value;
    this.value = (this.value instanceof Array && value instanceof Array) ? this.value.concat(value) : value;

};


module.factory('$RAW', ['$q', '$http',
    function ($q, $http) {
        return {
            call: function (m, functn, data, callback) {
                var now = new Date();

                return $http.post('/api/' + m + '/' + functn, data).then(
                    function successCallback(res) {
                        // parse result (again)
                        try {
                            res = JSON.parse(res);
                        } catch (ex) {
                            // doNothing
                        }
                        // yield result
                        callback(null, res.data, new Date() - now);
                    },
                    function errorCallback(res) {
                        callback(res.data, null, new Date() - now);
                    }
                );
            },
            get: function (url, user_token) {
                var header = {};
                header.Accept = 'application/vnd.github.moondragon+json';
                if (user_token) {
                    header.Authorization = 'token ' + user_token;
                }

                return $http.get(url, { 'headers': header });
            }
        };
    }
]);


module.factory('$RPC', ['$RAW', '$log',
    function ($RAW, $log) {

        return {
            call: function (m, functn, data, callback) {
                var res = new ResultSet();
                $RAW.call(m, functn, data, function (error, value) {
                    res.set(error, value);
                    $log.debug('$RPC', m, functn, data, res, res.error);
                    if (typeof callback === 'function') {
                        callback(res.error, res);
                    }
                });

                return res;
            }
        };
    }
]);


module.factory('$HUB', ['$RAW', '$log',
    function ($RAW, $log) {
        function parse_link_header(header) {
            if (header.length === 0) {
                throw new Error('input must not be of zero length');
            }

            // Split parts by comma
            var parts = header.split(',');
            var links = {};
            // Parse each part into a named link
            parts.forEach(function (p) {
                var section = p.split(';');
                if (section.length !== 2) {
                    throw new Error('section could not be split on ";"');
                }
                var url = section[0].replace(/<(.*)>/, '$1').trim();
                var name = section[1].replace(/rel="(.*)"/, '$1').trim();
                links[name] = url;
            });

            return links;
        }

        function exec(type, res, args, call) {
            $RAW.call('github', type, args, function (error, value) {

                var data = value ? value.data : null;
                var meta = value ? value.meta : null;

                if (!data && value) {
                    data = value;
                }

                res.set(error, data);

                if (meta) {
                    res.meta = meta;
                    var links = meta.link ? parse_link_header(meta.link) : null;

                    res.hasMore = meta.hasMore || (!!links && !!links.next);

                    res.getMore = res.hasMore ? function () {

                        res.loaded = false;
                        res.loading = true;

                        if (links.next) {
                            args.url = links.next;
                        } else {
                            args.arg.page = args.arg.page + 1 || 2;
                        }

                        exec(type, res, args, call);

                    } : null;
                }

                $log.debug('$HUB', args, res, res.error);

                if (typeof call === 'function') {
                    call(res.error, res);
                }
            });

            return res;
        }

        return {
            call: function (o, functn, data, callback) {
                return exec('call', new ResultSet(), { obj: o, fun: functn, arg: data }, callback);
            },
            // direct_call: function(url, data, callback) {
            //     return exec('direct_call', new ResultSet(), { url: url, arg: data }, callback);
            // },
            wrap: function (o, functn, data, callback) {
                return exec('wrap', new ResultSet(), { obj: o, fun: functn, arg: data }, callback);
            }
        };
    }


]);


// *****************************************************
// Angular Route Provider Resolve Promises
// *****************************************************


module.factory('$HUBService', ['$q', '$HUB',
    function ($q, $HUB) {

        var exec = function (type, o, functn, data, callback) {
            var deferred = $q.defer();
            $HUB[type](o, functn, data, function (err, obj) {

                if (typeof callback === 'function') {
                    callback(err, obj);
                }

                if (!err) {
                    deferred.resolve(obj);
                }

                return deferred.reject(new Error(err));
            });

            return deferred.promise;
        };

        return {
            call: function (o, functn, data, callback) {
                return exec('call', o, functn, data, callback);
            },
            wrap: function (o, functn, data, callback) {
                return exec('wrap', o, functn, data, callback);
            }
        };
    }
]);


// *****************************************************
// Angular Route Provider Resolve Promises
// *****************************************************


module.factory('$RPCService', ['$q', '$RPC',
    function ($q, $RPC) {
        return {
            call: function (o, functn, data, callback) {
                var deferred = $q.defer();
                $RPC.call(o, functn, data, function (err, obj) {

                    if (typeof callback === 'function') {
                        callback(err, obj);
                    }

                    if (!err) {
                        return deferred.resolve(obj);
                    }
                    try {
                        err = JSON.parse(err);
                    } catch (e) {
                        // empty
                    }

                    return deferred.reject(err);
                });

                return deferred.promise;
            }
        };
    }
]);
