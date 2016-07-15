import { beforeEachProviders, async, inject } from '@angular/core/testing';
import { MockBackend } from '@angular/http/testing';
import { getHttpMockServices, setupFakeConnection } from '../../testUtils/http';

import { ClaBackendService } from './claBackend.service';
import { LinkedRepo } from './linkedItem';

const testData = {
  linkedRepo: [
    new LinkedRepo({
      repoId: '1234',
      repo: 'myRepo',
      owner: 'test',
      gist: 'gist url',
      fork: false
    }),
    new LinkedRepo({
      repoId: '5678',
      repo: 'myRepo2',
      owner: 'test',
      gist: 'gist url',
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
  ]
};

describe('ClaBackendService', () => {
  let claBackendService: ClaBackendService;
  let mockBackend: MockBackend;
  beforeEachProviders(() => {
    return [
      ClaBackendService,
      ...getHttpMockServices()
    ];
  });
  beforeEach(inject([ClaBackendService, MockBackend], (cbs, mb) => {
    claBackendService = cbs;
    mockBackend = mb;
  }));

  describe('getLinkedRepos', () => {
    it('should return the linked repos and merge the fork property from the Github repos', async(() => {
      const expectedBody = {set: [
        {
          repoId: testData.githubRepos[0].id,
          owner: testData.githubRepos[0].owner.login,
          repo: testData.githubRepos[0].name
        }, {
          repoId: testData.githubRepos[1].id,
          owner: testData.githubRepos[1].owner.login,
          repo: testData.githubRepos[1].name
        }
      ]};
      const fakeResponseBody = [
        {
          repoId: '1234',
          repo: 'myRepo',
          owner: 'test',
          gist: 'gist url'
        }, {
          repoId: '5678',
          repo: 'myRepo2',
          owner: 'test',
          gist: 'gist url'
        }
      ];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/repo/getAll',
          expectedBody,
          fakeResponseBody
        }
      );
      claBackendService.getLinkedRepos(testData.githubRepos).subscribe((result) => {
        expect(result).toEqual(testData.linkedRepo);
      });
    }));
  });

  describe('linkCla', () => {
    it('should link the cla and repo if the item is a LinkedRepo', async(() => {
      const item = testData.linkedRepo[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/repo/create',
          expectedBody: item.getCompleteObject(),
          fakeResponseBody: {}
        }
      );
      claBackendService.linkCla(item).subscribe((result) => {
        expect(result).toEqual({});
      });
    }));
    // it('should link the cla and org if the item is a LinkedOrg', async(() => {
    //   expect(false).toBeTruthy('Not implemented');
    // }));
  });

  describe('unlinkCla', () => {
    it('should unlink the cla and repo if the item is a LinkedRepo', async(() => {
      const item = testData.linkedRepo[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/repo/remove',
          expectedBody: item.getIdObject(),
          fakeResponseBody: {}
        }
      );
      claBackendService.unlinkCla(item).subscribe((result) => {
        expect(result).toEqual({});
      });
    }));
    // it('should unlink the cla and org if the item is a LinkedOrg', async(() => {
    //   expect(false).toBeTruthy('Not implemented');
    // }));
  });

  describe('getGistInfo', () => {
    it('should return information about the gist of the linkedItem', async(() => {
      const item = testData.linkedRepo[0];
      const expectedBody = { gist: { gist_url: item.gist } };
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/cla/getGist',
          expectedBody,
          fakeResponseBody: {}
        }
      );
      claBackendService.getGistInfo(item).subscribe((result) => {
        expect(result).toEqual({});
      });
    }));
  });

  describe('getClaSignatures', () => {
    it('should return an array of cla signatures', async(() => {
      const item = testData.linkedRepo[0];
      const expectedBody = {
        repoId: item.id,
        gist: { gist_url: item.gist, gist_version: '1234' }
      };
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/cla/getAll',
          expectedBody,
          fakeResponseBody: '[]'
        }
      );
      claBackendService.getClaSignatures(item, '1234').subscribe((result) => {
        expect(result).toEqual([]);
      });
    }));
  });

  describe('addWebhook', () => {
    it('should add a webhook for the linked item', async(() => {
      const item = testData.linkedRepo[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/webhook/create',
          expectedBody: item.getCompleteObject(),
          fakeResponseBody: {}
        }
      );
      claBackendService.addWebhook(item).subscribe((result) => {
        expect(result).toEqual({});
      });
    }));
  });

  describe('removeWebhook', () => {
    it('should remove the webhook for the linked item', async(() => {
      const item = testData.linkedRepo[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/webhook/remove',
          expectedBody: item.getNameObject(),
          fakeResponseBody: {}
        }
      );
      claBackendService.removeWebhook(item).subscribe((result) => {
        expect(result).toEqual({});
      });
    }));
  });

  describe('getWebhook', () => {
    it('should return the webhook for the linked item', async(() => {
      const item = testData.linkedRepo[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/webhook/get',
          expectedBody: item.getNameObject(),
          fakeResponseBody: {}
        }
      );
      claBackendService.getWebhook(item).subscribe((result) => {
        expect(result).toEqual({});
      });
    }));
    it('should return null if an empty body is returned', async(() => {
      const item = testData.linkedRepo[0];
      setupFakeConnection(
        mockBackend,
        {
          expectedUrl: '/api/webhook/get',
          expectedBody: item.getNameObject(),
          fakeResponseBody: ''
        }
      );
      claBackendService.getWebhook(item).subscribe((result) => {
        expect(result).toEqual(null);
      });
    }));
  });

});
