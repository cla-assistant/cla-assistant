import { inject, fakeAsync} from '@angular/core/testing';
import { provide } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { observableMatchers } from '../test-utils/observableMatcher';
import { HomeService } from './home.service';
import { GithubCacheService } from '../shared/github';
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
      fileName: 'myGist1',
      url: 'https://gist.github.com/test1',
      updatedAt: '2010-04-14T02:15:15Z',
      history: []
    },
    {
      fileName: 'myGist2',
      url: 'https://gist.github.com/test2',
      updatedAt: '2010-04-14T02:15:15Z',
      history: []
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

function createGithubCacheServiceMock() {
  return {
    // First return incomplete result(first page) and the load rest
    getCurrentUserRepos: jasmine.createSpy('getCurrentUserRepos').and.returnValue(
      Observable.of([testData.githubRepos[0]], testData.githubRepos)
    )
  };
}

function createClaBackendService(linkedRepos) {
  return {
    linkRepo: jasmine.createSpy('linkRepo').and.returnValue(Observable.of({})),
    unlinkCla: jasmine.createSpy('unlinkCla').and.returnValue(Observable.of({})),
    addWebhook: jasmine.createSpy('addWebhook').and.returnValue(Observable.of({})),
    removeWebhook: jasmine.createSpy('removeWebhook').and.returnValue(Observable.of({})),
    getLinkedRepos: jasmine.createSpy('linkCla').and.returnValue(Observable.of(linkedRepos))
  };
}

describe('Home Service', () => {
  let homeService: HomeService;
  let githubCacheServiceMock;
  let claBackendServiceMock;


  beforeEach(() => {
    githubCacheServiceMock = createGithubCacheServiceMock();
    claBackendServiceMock = createClaBackendService(testData.linkedRepos);
    homeService = new HomeService(githubCacheServiceMock, claBackendServiceMock);
    jasmine.addMatchers(observableMatchers);
  });

  describe('link', () => {
    it('should call the right backend methods and add a new linked repo', fakeAsync(() => {
      let linkedRepos: LinkedRepo[];
      homeService.getLinkedRepos().subscribe(
        repos => linkedRepos = repos
      );
      claBackendServiceMock.linkRepo.and.returnValue(Observable.of(testData.linkedRepos[0]));
      const resultObservable1 = homeService.link(testData.gists[0], testData.githubRepos[0]);

      expect(resultObservable1).toEmitValues(testData.linkedRepos[0]);
      expect(linkedRepos).toEqual([testData.linkedRepos[0]]);
      expect(claBackendServiceMock.linkRepo).toHaveBeenCalledWith(testData.githubRepos[0], testData.gists[0]);
      expect(claBackendServiceMock.addWebhook).toHaveBeenCalledWith(testData.linkedRepos[0]);

      claBackendServiceMock.linkRepo.and.returnValue(Observable.of(testData.linkedRepos[1]));
      const resultObservable2 = homeService.link(testData.gists[1], testData.githubRepos[1]);

      expect(resultObservable2).toEmitValues(testData.linkedRepos[1]);
      expect(linkedRepos).toEqual([testData.linkedRepos[0], testData.linkedRepos[1]]);
      expect(claBackendServiceMock.linkRepo).toHaveBeenCalledWith(testData.githubRepos[1], testData.gists[1]);
      expect(claBackendServiceMock.addWebhook).toHaveBeenCalledWith(testData.linkedRepos[1]);
    }));
  });

  describe('unlinkRepo', () => {
    it('remove the linked repo', fakeAsync(() => {
      let linkedRepos: LinkedRepo[];
      homeService.getLinkedRepos().subscribe(
        repos => linkedRepos = repos
      );
      claBackendServiceMock.linkRepo.and.returnValue(Observable.of(testData.linkedRepos[0]));
      homeService.link(testData.gists[0], testData.githubRepos[0]).subscribe();
      claBackendServiceMock.linkRepo.and.returnValue(Observable.of(testData.linkedRepos[1]));
      homeService.link(testData.gists[1], testData.githubRepos[1]).subscribe();
      homeService.unlinkItem(testData.linkedRepos[0]);

      expect(homeService.getLinkedRepos()).toEmitValues([testData.linkedRepos[1]]);
      expect(claBackendServiceMock.unlinkCla).toHaveBeenCalledWith(testData.linkedRepos[0]);
      expect(claBackendServiceMock.removeWebhook).toHaveBeenCalledWith(testData.linkedRepos[0]);
    }));
  });

  describe('getLinkedRepos', () => {
    it('should immediately call the observer with the initial value', fakeAsync(() => {
      expect(homeService.getLinkedRepos()).toEmitValues([]);
    }));
  });

  describe('requestReposFromBackend', () => {
    it('should wait for all GitHub repos to be fetched(multiple pages) and add the linked repos', fakeAsync(() => {
      homeService.requestReposFromBackend();
      expect(homeService.getLinkedRepos()).toEmitValues(testData.linkedRepos);
      expect(claBackendServiceMock.getLinkedRepos).toHaveBeenCalledWith(testData.githubRepos);
    }));
  });

});
