import { beforeEachProviders, fakeAsync, inject, tick } from '@angular/core/testing';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { provide } from '@angular/core';
import { Http, ConnectionBackend, BaseRequestOptions, Response, ResponseOptions } from '@angular/http';

import { GithubService } from './github.service';
import { User } from './user';
import { Gist } from './gist';

function getHttpMockServices() {
  return [
    BaseRequestOptions,
    MockBackend,
    provide(Http, {
      useFactory:
      (backend: ConnectionBackend, defaultOptions: BaseRequestOptions) => {
        return new Http(backend, defaultOptions);
      },
      deps: [MockBackend, BaseRequestOptions]
    })
  ];
}

interface SetupFakeConnectionOptions {
  mockBackend: MockBackend;
  expectedUrl?: string;
  expectedBody?: Object;
  fakeResponseBody?: Object;
}
function setupFakeConnection({mockBackend, expectedUrl, expectedBody, fakeResponseBody }: SetupFakeConnectionOptions) {
  mockBackend.connections.subscribe((conn: MockConnection) => {
    if (expectedUrl) { expect(conn.request.url).toEqual(expectedUrl); }
    if (expectedBody) { expect(conn.request.text()).toEqual(JSON.stringify(expectedBody)); }
    if (fakeResponseBody) {
      const responseOptions = new ResponseOptions({
        body: fakeResponseBody
      });
      conn.mockRespond(new Response(responseOptions));
    }
  });
}

describe('GithubSerive', () => {
  let githubService, mockBackend;
  beforeEachProviders(() => {
    return [
      GithubService,
      ...getHttpMockServices()
    ];
  });
  beforeEach(inject([GithubService, MockBackend], (gs, mb) => {
    githubService = gs;
    mockBackend = mb;
  }));

  describe('getUser', () => {
    it('returns the currently logged in user', fakeAsync(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = { obj: 'users', fun: 'get', arg: {} };
      const expectedResponse = {
        html_url: 'test url',
        avatar_url: 'test avater url',
        login: 'test user name'
      };
      const fakeResponseBody = {
        data: expectedResponse
      };
      setupFakeConnection({
        mockBackend,
        expectedUrl,
        expectedBody,
        fakeResponseBody
      });

      let result: User;
      githubService.getUser().subscribe((res) => {
        result = res;
      });
      tick();

      expect(result).toEqual(expectedResponse);
    }));
  });
  describe('getUserGists', () => {
    it('returns all gists of the logged in user', fakeAsync(() => {
      const expectedUrl = '/api/github/call';
      const expectedBody = { obj: 'gists', fun: 'getAll', arg: {} };
      const expectedResponse = [{
        name: 'myGist',
        url: 'gist url'
      }, {
          name: 'myCLA.txt',
          url: 'gist 2 url'
        }];
      const fakeResponseBody = {
        data: [{
          files: { myGist: {} },
          html_url: 'gist url'
        }, {
            files: { myCLA: { filename: 'myCLA.txt' }, otherFile: {} },
            html_url: 'gist 2 url'
          }]
      };

      setupFakeConnection({
        mockBackend,
        expectedUrl,
        expectedBody,
        fakeResponseBody
      });
      let result: Gist[];
      githubService.getUserGists().subscribe((res) => {
        result = res;
      });
      tick();

      expect(result).toEqual(expectedResponse);
    }));
  });
  describe('getDefaultGists', () => {
    it('returns the default CLAs', fakeAsync(() => {
      const expectedUrl = '/static/cla-assistant.json';
      const expectedResponse = [
        {
          name: 'SAP individual CLA',
          url: 'https://gist.github.com/CLAassistant/bd1ea8ec8aa0357414e8'
        }];
      const fakeResponseBody = {};
      fakeResponseBody['default-cla'] = expectedResponse;

      setupFakeConnection({
        mockBackend,
        expectedUrl,
        fakeResponseBody
      });
      let result: Gist[];
      githubService.getDefaultGists().subscribe((res) => {
        result = res;
      });
      tick();

      expect(result).toEqual(expectedResponse);
    }));
  });

});

