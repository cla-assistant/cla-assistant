/*jshint expr:true*/
/*sinon, describe, xit, it, beforeEach, afterEach*/
var utils, testData;

describe('Utils service', function () {
    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('ngAnimateMock'));


    beforeEach(angular.mock.inject(function ($injector, _utils_) {
        utils = _utils_;

        testData = {};
        testData.gist = {
            'url': 'https://api.github.com/gists/aa5a315d61ae9438b18d',
            'id': 'aa5a315d61ae9438b18d',
            'description': 'description of gist',
            'owner': {
                'login': 'octocat',
                'id': 1
            },
            'user': null,
            'files': {
                'ring.erl': {
                    'filename': 'Ring',
                    'content': 'contents of gist',
                    'updated_at': '2010-04-14T02:15:15Z'
                }
            },
            'html_url': 'https://gist.github.com/aa5a315d61ae9438b18d',
            'history': [{
                'url': 'https://api.github.com/gists/aa5a315d61ae9438b18d/57a7f021a713b1c5a6a199b54cc514735d2d462f',
                'version': '57a7f021a713b1c5a6a199b54cc514735d2d462f',
                'user': {
                    'login': 'octocat',
                    'id': 1
                },
                'committed_at': '2010-04-14T02:15:15Z'
            }]
        };
    }));

    it('should return name of the given gist', function () {
        var name = utils.getGistAttribute(testData.gist, 'filename');

        name.should.be.equal('Ring');
    });

    it('should return file name of the given gist', function () {
        testData.gist.files['ring.erl'].filename = undefined;
        var name = utils.getGistAttribute(testData.gist, 'fileName');

        name.should.be.equal('ring.erl');
    });

    it('should return "updated_at" of the given gist', function () {
        var name = utils.getGistAttribute(testData.gist, 'updated_at');

        name.should.be.equal('2010-04-14T02:15:15Z');
    });

    it('should not fail if gist obj has no files', function () {
        testData.gist.files = undefined;

        var name = utils.getGistAttribute(testData.gist, 'filename');

        (!name).should.be.equal(true);
    });
});