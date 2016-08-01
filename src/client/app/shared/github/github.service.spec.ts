import { beforeEachProviders, fakeAsync, tick, inject } from '@angular/core/testing';
import { MockBackend } from '@angular/http/testing';
import { getHttpMockServices, setupFakeConnection } from '../../test-utils/http';
import { observableMatchers } from '../../test-utils/observable';


import { GithubService } from './github.service';
import { User } from './user';
import { Gist } from './gist';
import { GithubRepo } from './repo';
import { GithubOrg } from './org';


describe('GithubService', () => {
  let githubService: GithubService, mockBackend;
  beforeEachProviders(() => {
    return [
      GithubService,
      ...getHttpMockServices()
    ];
  });
  beforeEach(inject([GithubService, MockBackend], (gs, mb) => {
    githubService = gs;
    mockBackend = mb;
    jasmine.addMatchers(observableMatchers);
  }));

  describe('getGistInfo', () => {
    it('should return information about the gist of the linkedItem', fakeAsync(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = { obj: 'gists', fun: 'get', arg: { id: 'v1234' } };
      const expectedResponse: Gist = {
        fileName: 'myGist',
        url: 'gist url',
        updatedAt: '2011-06-20T11:34:15Z',
        history: []
      };
      const fakeResponseBody = {
        data: {
          files: { myGist: {} },
          html_url: 'gist url',
          updated_at: '2011-06-20T11:34:15Z',
          history: []
        }
      };
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl,
          expectedBody,
          fakeResponseBody
        }
      );
      const resultObservable = githubService.getGistInfo('http://gist.github.com/bla/v1234');
      expect(resultObservable).toEmitValues(expectedResponse);
    }));
  });

  describe('getUser', () => {

    it('should return the currently logged in user', fakeAsync(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = { obj: 'users', fun: 'get', arg: {} };
      const expectedResponse: User = {
        htmlUrl: 'test url',
        avatarUrl: 'test avatar url',
        login: 'test user name',
        roles: {
          admin: true,
          orgAdmin: false
        }
      };
      const fakeResponseBody = {
        data: {
          html_url: 'test url',
          avatar_url: 'test avatar url',
          login: 'test user name'
        },
        meta: {
          scopes: '....write:repo_hook....'
        }
      };
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl,
          expectedBody,
          fakeResponseBody
        }
      );
      const resultObservable = githubService.getUser();
      expect(resultObservable).toEmitValues(expectedResponse);
    }));

  });

  describe('getUserGists', () => {

    it('should return all gists of the logged in user', fakeAsync(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = { obj: 'gists', fun: 'getAll', arg: { per_page: 100, page: 1 } };
      const fakeResponseBody = {
        data: [{
          files: { myGist: {} },
          html_url: 'gist url',
          updated_at: '2011-06-20T11:34:15Z',
          history: []
        }, {
            files: { myCLA: { filename: 'myCLA.txt' }, otherFile: {} },
            html_url: 'gist 2 url',
            updated_at: '2011-06-21T11:34:15Z',
            history: []
          }]
      };
      const expectedResponse: Gist[] = [{
        fileName: 'myGist',
        url: 'gist url',
        updatedAt: '2011-06-20T11:34:15Z',
        history: []
      }, {
          fileName: 'myCLA.txt',
          url: 'gist 2 url',
          updatedAt: '2011-06-21T11:34:15Z',
          history: []
        }];

      setupFakeConnection(
        mockBackend,
        {
          expectedUrl,
          expectedBody,
          fakeResponseBody
        }
      );
      const resultObservable = githubService.getUserGists();
      expect(resultObservable).toEmitValues(expectedResponse);
    }));

    it('should request more gists if meta.hasMore is set', fakeAsync(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody1 = { obj: 'gists', fun: 'getAll', arg: { per_page: 100, page: 1 } };
      const expectedBody2 = { obj: 'gists', fun: 'getAll', arg: { per_page: 100, page: 2 } };
      const fakeResponseBody1 = {
        data: [{
          files: { myGist1: {} },
          html_url: 'gist url1',
          updated_at: '',
          history: []
        }],
        meta: { hasMore: true }
      };
      const fakeResponseBody2 = {
        data: [{
          files: { myGist2: {} },
          html_url: 'gist url2',
          updated_at: '',
          history: []
        }],
        meta: { hasMore: false }
      };
      const expectedResult1 = [{
        fileName: 'myGist1',
        url: 'gist url1',
        updatedAt: '',
        history: []
      }];
      const expectedResult2 = [{
        fileName: 'myGist1',
        url: 'gist url1',
        updatedAt: '',
        history: []
      }, {
          fileName: 'myGist2',
          url: 'gist url2',
          updatedAt: '',
          history: []
        }];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl,
          expectedBody: expectedBody1,
          fakeResponseBody: fakeResponseBody1
        },
        {
          expectedUrl,
          expectedBody: expectedBody2,
          fakeResponseBody: fakeResponseBody2
        }
      );

      const resultObservable = githubService.getUserGists();
      expect(resultObservable).toEmitValues(expectedResult1, expectedResult2);
    }));

  });

  describe('getUserRepos', () => {

    it('should return all repos of the logged in user', fakeAsync(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = {
        obj: 'repos',
        fun: 'getAll',
        // ,organization_member
        arg: { per_page: 100, affiliation: 'owner', page: 1 }
      };
      const fakeResponseBody = {
        data: [
          { id: 123, fork: true, full_name: 'test/myRepo', name: 'myRepo', owner: { login: 'test' } },
          { id: 456, fork: true, full_name: 'test/myRepo2', name: 'myRepo2', owner: { login: 'test' } }
        ]
      };
      const expectedResult: GithubRepo[] = [
        { id: 123, fork: true, fullName: 'test/myRepo', name: 'myRepo', owner: { login: 'test' } },
        { id: 456, fork: true, fullName: 'test/myRepo2', name: 'myRepo2', owner: { login: 'test' } }
      ];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl,
          expectedBody,
          fakeResponseBody
        }
      );
      const resultObservable = githubService.getUserRepos();
      expect(resultObservable).toEmitValues(expectedResult);
    }));

  });

  describe('getUserOrgs', () => {

    it('should return all orgs of the logged in user where he has admin rights', fakeAsync(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = {
        obj: 'orgs',
        fun: 'getOrganizationMemberships',
        arg: { per_page: 100, page: 1 }
      };
      const fakeResponseBody = {
        data: [
          { role: 'admin', organization: { login: 'MyOrg', id: 123, avatar_url: 'avatar url' } },
          { role: 'member', organization: { login: 'MyOrg2' } }
        ]
      };
      const expectedResult: GithubOrg[] = [
        {
          login: 'MyOrg',
          id: 123,
          avatarUrl: 'avatar url'
        }
      ];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl,
          expectedBody,
          fakeResponseBody
        }
      );
      const resultObservable = githubService.getUserOrgs();
      expect(resultObservable).toEmitValues(expectedResult);
    }));

  });

});
