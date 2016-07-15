import { beforeEachProviders, inject} from '@angular/core/testing';
import { provide } from '@angular/core';
import { Observable } from 'rxjs';

import { createFakeObservable } from '../testUtils/observable';
import { HomeService } from './home.service';
import { HomeCacheService } from './homeCache.service';
import { ClaBackendService } from '../shared/claBackend/claBackend.service';
import { LinkedRepo } from '../shared/claBackend/linkedItem';

const testData = {
  linkedRepos: [
    new LinkedRepo({
      repoId: '1234',
      repo: 'myRepo',
      owner: 'test',
      gist: 'https://gist.github.com/test1',
      fork: false
    }),
    new LinkedRepo({
      repoId: '5678',
      repo: 'myRepo2',
      owner: 'test',
      gist: 'https://gist.github.com/test2',
      fork: true
    })
  ],
  gists: [
    {
      name: 'myGist1',
      url: 'https://gist.github.com/test1'
    },
    {
      name: 'myGist2',
      url: 'https://gist.github.com/test2'
    }
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

describe('Home Service', () => {
  let homeService: HomeService;
  let homeCacheServiceMock = {
    // First return incomplete result(first page) and the load rest
    currentUserRepos: Observable.of([testData.githubRepos[0]], testData.githubRepos)
  };
  let claBackendServiceMock = jasmine.createSpyObj(
    'claBackendServiceMock',
    ['linkCla', 'unlinkCla', 'addWebhook', 'removeWebhook', 'getLinkedRepos']);
  claBackendServiceMock.linkCla.and.returnValue(Observable.of({}));
  claBackendServiceMock.unlinkCla.and.returnValue(Observable.of({}));
  claBackendServiceMock.addWebhook.and.returnValue(Observable.of({}));
  claBackendServiceMock.removeWebhook.and.returnValue(Observable.of({}));
  claBackendServiceMock.getLinkedRepos.and.callFake((githubRepos) => {
    expect(githubRepos).toEqual(testData.githubRepos);
    return Observable.of(testData.linkedRepos);
  });

  beforeEachProviders(() => [
    HomeService,
    provide(HomeCacheService, { useValue: homeCacheServiceMock }),
    provide(ClaBackendService, { useValue: claBackendServiceMock })
  ]);

  beforeEach(inject([HomeService], (hs) => {
    homeService = hs;
  }));

  describe('link', () => {
    it('should call the right backend methods and add a new linked repo', () => {
      let linkedRepos: LinkedRepo[];
      homeService.getLinkedRepos().subscribe(
        repos => linkedRepos = repos
      );
      homeService.link(testData.gists[0], testData.githubRepos[0]).subscribe(
        repo => expect(repo).toEqual(testData.linkedRepos[0])
      );
      expect(linkedRepos).toEqual([testData.linkedRepos[0]]);
      expect(claBackendServiceMock.linkCla).toHaveBeenCalledWith(testData.linkedRepos[0]);
      expect(claBackendServiceMock.addWebhook).toHaveBeenCalledWith(testData.linkedRepos[0]);

      homeService.link(testData.gists[1], testData.githubRepos[1]).subscribe(
        repo => expect(repo).toEqual(testData.linkedRepos[1])
      );
      expect(linkedRepos).toEqual([testData.linkedRepos[0], testData.linkedRepos[1]]);
      expect(claBackendServiceMock.linkCla).toHaveBeenCalledWith(testData.linkedRepos[1]);
      expect(claBackendServiceMock.addWebhook).toHaveBeenCalledWith(testData.linkedRepos[1]);
    });
  });

  describe('unlinkRepo', () => {
    it('remove the linked repo', () => {
      let linkedRepos: LinkedRepo[];
      homeService.getLinkedRepos().subscribe(
        repos => linkedRepos = repos
      );
      homeService.link(testData.gists[0], testData.githubRepos[0]).subscribe();
      homeService.link(testData.gists[1], testData.githubRepos[1]).subscribe();
      homeService.unlinkRepo(testData.linkedRepos[0]);
      expect(linkedRepos).toEqual([testData.linkedRepos[1]]);
      expect(claBackendServiceMock.unlinkCla).toHaveBeenCalledWith(testData.linkedRepos[0]);
      expect(claBackendServiceMock.addWebhook).toHaveBeenCalledWith(testData.linkedRepos[0]);
    });
  });

  describe('getLinkedRepos', () => {
    it('should immediately call the observer with the initial value', () => {
      homeService.getLinkedRepos().subscribe(
        value => expect(value).toEqual([])
      );
    });
  });

  describe('requestReposFromBackend', () => {
    it('should wait for all Repos to be fetched(multiple pages) and add the linked repos', () => {
      let linkedRepos: LinkedRepo[];
      homeService.getLinkedRepos().subscribe(
        repos => linkedRepos = repos
      );
      homeService.requestReposFromBackend();
      expect(linkedRepos).toEqual(testData.linkedRepos);
    });
  });

});
