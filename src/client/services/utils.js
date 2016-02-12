'use strict';

module.factory('utils', [
    function() {
        return {
            getGistAttribute: function(gist, attribute) {
                var attr;
                if (gist && gist.files) {
                    attr = Object.keys(gist.files)[0];
                    attr = gist.files[attr][attribute] ? gist.files[attr][attribute] : attr;
                }
                return attr;
            }
        };
    }
]);