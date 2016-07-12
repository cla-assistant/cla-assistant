import { beforeEachProviders, async, inject } from '@angular/core/testing';
import { MockBackend } from '@angular/http/testing';
import { provide } from '@angular/core';
import { Router } from '@angular/router';
import { getHttpMockServices, setupFakeConnection } from '../../testUtils/http';

import { GithubService } from './github.service';
import { User } from './user';
import { Gist } from './gist';
import { GithubRepo } from './repo';


describe('GithubSerive', () => {
  const mockRouter = jasmine.createSpyObj('MockRouter', ['navigate']);
  let githubService, mockBackend;
  beforeEachProviders(() => {
    return [
      GithubService,
      provide(Router, { useValue: mockRouter }),
      ...getHttpMockServices()
    ];
  });
  beforeEach(inject([GithubService, MockBackend], (gs, mb) => {
    githubService = gs;
    mockBackend = mb;
  }));

  describe('getUser', () => {

    it('should return the currently logged in user', async(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = { obj: 'users', fun: 'get', arg: {} };
      const expectedResponse: User = {
        htmlUrl: 'test url',
        avatarUrl: 'test avater url',
        login: 'test user name',
        roles: {
          admin: false,
          orgAdmin: false
        }
      };
      const fakeResponseBody = {
        data: {
          html_url: 'test url',
          avatar_url: 'test avater url',
          login: 'test user name'
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

      githubService.getUser().subscribe((result) => {
        expect(result).toEqual(expectedResponse);
      });
    }));

  });

  describe('getUserGists', () => {

    it('should return all gists of the logged in user', async(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = { obj: 'gists', fun: 'getAll', arg: { per_page: 100, page: 1 } };
      const fakeResponseBody = {
        data: [{
          files: { myGist: {} },
          html_url: 'gist url'
        }, {
            files: { myCLA: { filename: 'myCLA.txt' }, otherFile: {} },
            html_url: 'gist 2 url'
          }]
      };
      const expectedResponse: Gist[] = [{
        name: 'myGist',
        url: 'gist url'
      }, {
          name: 'myCLA.txt',
          url: 'gist 2 url'
        }];

      setupFakeConnection(
        mockBackend,
        {
          expectedUrl,
          expectedBody,
          fakeResponseBody
        }
      );
      githubService.getUserGists().subscribe((result) => {
        expect(result).toEqual(expectedResponse);
      });
    }));

    it('should request more gists if meta.hasMore is set', async(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody1 = { obj: 'gists', fun: 'getAll', arg: { per_page: 100, page: 1 } };
      const expectedBody2 = { obj: 'gists', fun: 'getAll', arg: { per_page: 100, page: 2 } };
      const fakeResponseBody1 = {
        data: [{
          files: { myGist1: {} },
          html_url: 'gist url1'
        }],
        meta: { hasMore: true }
      };
      const fakeResponseBody2 = {
        data: [{
          files: { myGist2: {} },
          html_url: 'gist url2'
        }],
        meta: { hasMore: false }
      };
      const expectedResult1 = [{
        name: 'myGist1',
        url: 'gist url1'
      }];
      const expectedResult2 = [{
        name: 'myGist1',
        url: 'gist url1'
      }, {
          name: 'myGist2',
          url: 'gist url2'
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
      let count = 1;
      githubService.getUserGists().subscribe((result) => {
        if (count === 1) { expect(result).toEqual(expectedResult1); }
        else { expect(result).toEqual(expectedResult2); }
        ++count;
      });
    }));

  });

  describe('getUserRepos', () => {

    it('should return all repos of the logged in user', async(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = {
        obj: 'repos',
        fun: 'getAll',
        arg: { per_page: 100, affiliation: 'owner,organization_member', page: 1 }
      };
      const expectedResponse: GithubRepo[] = [
        { fullName: 'myRepo' },
        { fullName: 'myRepo2' }
      ];
      const fakeResponseBody = {
        data: [
          { full_name: 'myRepo' },
          { full_name: 'myRepo2' }
        ]
      };
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl,
          expectedBody,
          fakeResponseBody
        }
      );
      githubService.getUserRepos().subscribe((result) => {
        expect(result).toEqual(expectedResponse);
      });
    }));

  });

});
