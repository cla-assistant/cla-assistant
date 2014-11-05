'use strict';

// *****************************************************
// API
// *****************************************************

function ResultSet() {

    this.loaded = false;
    this.loading = true;

}

ResultSet.prototype.set = function(error, value) {

    this.loaded = true;
    this.loading = false;

    this.error = error;
    this.affix = value;
    this.value = (this.value instanceof Array && value instanceof Array) ? this.value.concat(value) : value;

};


module.factory('$RAW', ['$http',
    function($http) {
        return {
            call: function(m, functn, data, callback) {
                var now = new Date();
                return $http.post('/api/' + m + '/' + functn, data)
                    .success(function(res) {
                        // parse result (again)
                        try {
                            res = JSON.parse(res);
                        } catch (ex) {}
                        // yield result
                        callback(null, res, new Date() - now);
                    })
                    .error(function(res) {
                        callback(res, null, new Date() - now);
                    });
            },
            get: function(url, callback) {
                return $http.get(url).
                    success(function(data, status){
                        callback(null, data, status);
                    })
                    .error(function(err, status){
                        callback(err, null, status);
                    });
            },
            post: function(url, d, callback) {
                return $http.post(url, d).
                    success(function(data, status){
                        callback(null, data, status);
                    })
                    .error(function(err, status){
                        callback(err, null, status);
                    });
            }
        };
    }
]);


module.factory('$RPC', ['$RAW', '$log',
    function($RAW, $log) {

        return {
            call: function(m, functn, data, callback) {
                var res = new ResultSet();
                $RAW.call(m, functn, data, function(error, value) {
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
    function($RAW, $log) {

        var exec = function(type, res, args, call) {
            $RAW.call('github', type, args, function(error, value) {

                var data = value ? value.data : null;
                var meta = value ? value.meta : null;

                res.set(error, data);

                if(meta) {
                    res.meta = meta;
                    res.hasMore = meta.hasMore;

                    res.getMore = meta.hasMore ? function() {

                        res.loaded = false;
                        res.loading = true;
                        args.arg.page = args.arg.page + 1 || 2;

                        exec(type, res, args, call);

                    } : null;
                }

                $log.debug('$HUB', args, res, res.error);

                if (typeof call === 'function') {
                    call(res.error, res);
                }
            });
            return res;
        };

        return {
            call: function(o, functn, data, callback) {
                return exec('call', new ResultSet(), { obj: o, fun: functn, arg: data }, callback);
            },
            wrap: function(o, functn, data, callback) {
                return exec('wrap', new ResultSet(), { obj: o, fun: functn, arg: data }, callback);
            }
        };
    }


]);


// *****************************************************
// Angular Route Provider Resolve Promises
// *****************************************************


module.factory('$HUBService', ['$q', '$HUB',
    function($q, $HUB) {

        var exec = function(type, o, functn, data, callback) {
            var deferred = $q.defer();
            $HUB[type](o, functn, data, function(err, obj) {

                if (typeof callback === 'function') {
                    callback(err, obj);
                }

                if(!err) {
                    deferred.resolve(obj);
                }
                return deferred.reject();
            });
            return deferred.promise;
        };

        return {
            call: function(o, functn, data, callback) {
                return exec('call', o, functn, data, callback);
            },
            wrap: function(o, functn, data, callback) {
                return exec('wrap', o, functn, data, callback);
            }
        };
    }
]);


// *****************************************************
// Angular Route Provider Resolve Promises
// *****************************************************


module.factory('$RPCService', ['$q', '$RPC',
    function($q, $RPC) {
        return {
            call: function(o, functn, data, callback) {
                var deferred = $q.defer();
                $RPC.call(o, functn, data, function(err, obj) {

                    if (typeof callback === 'function') {
                        callback(err, obj);
                    }

                    if(!err) {
                        deferred.resolve(obj);
                    }
                    return deferred.reject();
                });
                return deferred.promise;
            }
        };
    }
]);
