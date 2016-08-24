'use strict';
var reservedGistFileNames = ['metadata'];

module.factory('utils', ['$q', '$RPCService',
    function($q, $RPCService) {
        return {
            getGistAttribute: function(gist, attribute) {
                var attr;
                if (gist && gist.files) {
                    Object.keys(gist.files).some(function (file) {
                        if (reservedGistFileNames.indexOf(file) < 0) {
                            attr = file;
                            return true;
                        }
                    });
                    attr = gist.files[attr][attribute] ? gist.files[attr][attribute] : attr;
                }
                return attr;
            },
            getGistContent: function (repoId, orgId, gist_url, gist_version) {
                var deferred = $q.defer();
                var gistContent = {};
                var args = {
                    repoId: repoId,
                    orgId: orgId
                };
                if (gist_url) {
                    args.gist = {
                        gist_url: gist_url,
                        gist_version: gist_version
                    };
                }
                $RPCService.call('cla', 'get', args, function (err, cla) {
                    if (!err) {
                        gistContent.claText = cla.value.raw;

                        if (cla.value.meta) {
                            try {
                                var metaString = cla.value.meta.replace(/<p>|<\/p>|\n|\t/g, '');
                                gistContent.customFields = JSON.parse(metaString);
                                gistContent.customKeys = Object.keys(gistContent.customFields);
                                gistContent.hasCustomFields = true;
                                deferred.resolve(gistContent);
                            } catch (ex) {
                                deferred.reject(ex);
                            }
                        } else {
                            deferred.resolve(gistContent);
                        }
                    } else {
                        deferred.reject(err);
                    }
                });
                return deferred.promise;
            }
        };
    }
]);