import { TestBed, fakeAsync, inject } from '@angular/core/testing';
import { MockBackend } from '@angular/http/testing';
import { getHttpMockServices, setupFakeConnection } from '../../test-utils/http';

import { observableMatchers } from '../../test-utils/observableMatcher';
import { ClaBackendService } from './claBackend.service';
import { LinkedRepo, LinkedOrg } from './linkedItem';


const testData = {
  linkedRepos: [
    new LinkedRepo({
      repoId: '1234',
      repo: 'myRepo',
      owner: 'test',
      gist: 'https://gist.github.com/myGist1',
      fork: false
    }),
    new LinkedRepo({
      repoId: '5678',
      repo: 'myRepo2',
      owner: 'test',
      gist: 'https://gist.github.com/myGist2',
      fork: true
    })
  ],
  githubRepos: [
    {
      id: 1234,
      fullName: 'test/myRepo',
      name: 'myRepo',
      fork: false,
      owner: {
        login: 'test'
      }
    }, {
      id: 5678,
      fullName: 'test/myRepo2',
      name: 'myRepo2',
      fork: true,
      owner: {
        login: 'test'
      }
    }
  ],
  gists: [
    {
      fileName: 'myGist1.txt',
      url: 'https://gist.github.com/myGist1',
      updatedAt: null,
      history: []
    },
    {
      fileName: 'myGist2.txt',
      url: 'https://gist.github.com/myGist2',
      updatedAt: null,
      history: []
    }
  ]
};

describe('ClaBackendService', () => {
  let claBackendService: ClaBackendService;
  let mockBackend: MockBackend;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClaBackendService,
        ...getHttpMockServices()
      ]
    });
  });
  beforeEach(inject([ClaBackendService, MockBackend], (cbs, mb) => {
    claBackendService = cbs;
    mockBackend = mb;
    jasmine.addMatchers(observableMatchers);
  }));

  describe('getLinkedRepos', () => {
    it('should return the linked repos and merge the fork property from the Github repos', fakeAsync(() => {
      const expectedBody = {
        set: [
          {
            repoId: testData.githubRepos[0].id,
            owner: testData.githubRepos[0].owner.login,
            repo: testData.githubRepos[0].name
          }, {
            repoId: testData.githubRepos[1].id,
            owner: testData.githubRepos[1].owner.login,
            repo: testData.githubRepos[1].name
          }
        ]
      };
      const fakeResponseBody = [
        testData.linkedRepos[0].getCompleteObject(),
        testData.linkedRepos[1].getCompleteObject()
      ];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/repo/getAll',
          expectedBody,
          fakeResponseBody
        }
      );
      const resultObservable = claBackendService.getLinkedRepos(testData.githubRepos);
      expect(resultObservable).toEmitValues(testData.linkedRepos);
    }));
  });

  describe('getLinkedOrgs', () => {
    it('should return the linked orgs and merge the avatarUrl property from the Github orgs', fakeAsync(() => {
      const fakeResponseBody = [{
        orgId: '1234',
        org: 'test',
        gist: 'gist url'
      },
      {
        orgId: '5678',
        org: 'test2',
        gist: 'gist url 2'
      }];
      const expectedResult = [
        new LinkedOrg({
          orgId: '1234',
          org: 'test',
          gist: 'gist url',
          avatarUrl: 'avatar url'
        }),
        new LinkedOrg({
          orgId: '5678',
          org: 'test2',
          gist: 'gist url 2',
          avatarUrl: 'avatar url 2'
        })
      ];
      const githubOrgs = [
        {
          id: 1234,
          login: 'test',
          avatarUrl: 'avatar url'
        },
        {
          id: 5678,
          login: 'test2',
          avatarUrl: 'avatar url 2'
        }
      ];

      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/org/getForUser',
          expectedBody: {},
          fakeResponseBody
        }
      );
      const resultObservable = claBackendService.getLinkedOrgs(githubOrgs);
      expect(resultObservable).toEmitValues(expectedResult);
    }));
  });
  describe('linkRepo', () => {
    it('should link the cla and repo', fakeAsync(() => {
      const repo = testData.githubRepos[0];
      const gist = testData.gists[0];
      const linkedRepo = testData.linkedRepos[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/repo/create',
          expectedBody: linkedRepo.getCompleteObject(),
          fakeResponseBody: {}
        }
      );
      const resultObservable = claBackendService.linkRepo(repo, gist);
      expect(resultObservable).toEmitValues(linkedRepo);
    }));
  });

  describe('linkOrg', () => {
    it('should link the cla and org', fakeAsync(() => {
      const org = {
        id: 1234,
        login: 'test',
        avatarUrl: 'avatar url'
      };
      const gist =     {
      fileName: 'myGist1.txt',
      url: 'gist url',
      updatedAt: null,
      history: []
    };
      const linkedOrg = new LinkedOrg({
        orgId: '1234',
        org: 'test',
        gist: 'gist url',
        avatarUrl: 'avatar url'
      });
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/org/create',
          expectedBody: linkedOrg.getCompleteObject(),
          fakeResponseBody: {}
        }
      );
      const resultObservable = claBackendService.linkOrg(org, gist);
      expect(resultObservable).toEmitValues(linkedOrg);
    }));
  });

  describe('unlinkCla', () => {
    it('should unlink the cla and repo if the item is a LinkedRepo', fakeAsync(() => {
      const item = testData.linkedRepos[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/repo/remove',
          expectedBody: item.getIdObject(),
          fakeResponseBody: {}
        }
      );
      const resultObservable = claBackendService.unlinkCla(item);
      expect(resultObservable).toEmitValues({});
    }));
  });

  describe('getClaSignatures', () => {
    it('should return an array of cla signatures', fakeAsync(() => {
      const item = testData.linkedRepos[0];
      const expectedBody = {
        repoId: item.id,
        gist: { gist_url: item.gist, gist_version: '1234' }
      };
      const fakeResponseBody = [{
        repo: 'myRepo',
        repoId: '1234',
        owner: 'owner',
        ownerId: '4321',
        user: 'user',
        userId: '5678',
        gist_url: 'url',
        gist_version: 'v1234',
        created_at: '2010-04-14T02:15:15Z',
        org_cla: false,
        custom_fields: '{"test":"value"}'
      }];
      const expectedResult = [{
        repo_name: 'myRepo',
        repo_owner: 'owner',
        user_name: 'user',
        gist_url: 'url',
        gist_version: 'v1234',
        signed_at: '2010-04-14T02:15:15Z',
        org_cla: false,
        custom_fields: {test: 'value'}
      }];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/cla/getAll',
          expectedBody,
          fakeResponseBody: fakeResponseBody
        }
      );
      const resultObservable = claBackendService.getClaSignatures(item, '1234');
      expect(resultObservable).toEmitValues(expectedResult);
    }));
  });

  describe('addWebhook', () => {
    it('should add a webhook for the linked item', fakeAsync(() => {
      const item = testData.linkedRepos[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/webhook/create',
          expectedBody: item.getCompleteObject(),
          fakeResponseBody: {}
        }
      );
      const resultObservable = claBackendService.addWebhook(item);
      expect(resultObservable).toEmitValues({});
    }));
  });

  describe('removeWebhook', () => {
    it('should remove the webhook for the linked item', fakeAsync(() => {
      const item = testData.linkedRepos[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/webhook/remove',
          expectedBody: item.getNameObject(),
          fakeResponseBody: {}
        }
      );
      const resultObservable = claBackendService.removeWebhook(item);
      expect(resultObservable).toEmitValues({});
    }));
  });

  describe('getWebhook', () => {
    it('should return the webhook for the linked item', fakeAsync(() => {
      const item = testData.linkedRepos[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/webhook/get',
          expectedBody: item.getNameObject(),
          fakeResponseBody: {}
        }
      );
      const resultObservable = claBackendService.getWebhook(item);
      expect(resultObservable).toEmitValues({});
    }));
    it('should return null if an empty body is returned', fakeAsync(() => {
      const item = testData.linkedRepos[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/webhook/get',
          expectedBody: item.getNameObject(),
          fakeResponseBody: ''
        }
      );
      const resultObservable = claBackendService.getWebhook(item);
      expect(resultObservable).toEmitValues(null);
    }));
  });

});
