// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

'use strict';

module.factory('linkItemService', ['$RPCService',
    function ($RPCService) {
        function createNewItem(item, options, type) {
            if (!type) {
                type = options;
                options = item;
            }
            var newItem = {
                gist: options.gist.url,
                sharedGist: options.sharedGist,
                allowListPattern: options.allowListPattern,
                allowListPatternOrgs: options.allowListPatternOrgs,
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
            },

            migrate: function (item) {
                if (item.repo && item.owner) {
                    return $RPCService.call('repo', 'migrate', {
                        repo: item.repo,
                        owner: item.owner,
                    })
                }
                if (item.org && item.orgId) {
                    return $RPCService.call('org', 'migrate', {
                        org: item.org,
                        orgId: item.orgId,
                    })
                }
                throw 'migation type not supported yet'
            }
        };
    }
]);
