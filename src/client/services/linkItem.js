'use strict';

module.factory('linkItemService', ['$RPCService',
    function ($RPCService) {
        function createNewItem(item, options, type) {
            if (!type) {
                type = options;
                options = item;
            }
            var newItem = {
                gist: options.gist.url || options.gist,
                sharedGist: options.sharedGist,
                whiteListPattern: options.whiteListPattern,
                minFileChanges: options.minFileChanges,
                minCodeChanges: options.minCodeChanges,
                privacyPolicy: options.privacyPolicy
            };
            if (type === 'repo') {
                newItem.repoId = item.repoId || item.id;
                newItem.repo = item.repo || item.name;
                newItem.owner = item.owner.login || item.owner;
            } else {
                newItem.orgId = item.orgId || item.id;
                newItem.org = item.org || item.login;
                newItem.excludePattern = options.excludePattern;
            }

            return newItem;
        }

        return {
            createLink: function (item, options) {
                var type = item.full_name ? 'repo' : 'org';
                var newItem = createNewItem(item, options, type);

                return $RPCService.call(type, 'create', newItem);
            },

            updateLink: function (item) {
                var type = item.repoId ? 'repo' : 'org';
                var newItem = createNewItem(item, type);

                return $RPCService.call(type, 'update', newItem);
            }
        };
    }
]);