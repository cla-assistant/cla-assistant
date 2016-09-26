import { inject, fakeAsync, tick} from '@angular/core/testing';
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
    ),
    getCurrentUserOrgs: jasmine.createSpy('getCurrentUserOrgs').and.returnValue(
      Observable.empty()
    )
  };
}

function createClaBackendService(linkedRepos) {
  return {
    linkRepo: jasmine.createSpy('linkRepo').and.returnValue(Observable.of({})),
    unlinkCla: jasmine.createSpy('unlinkCla').and.returnValue(Observable.of({})),
    addWebhook: jasmine.createSpy('addWebhook').and.returnValue(Observable.of({})),
    removeWebhook: jasmine.createSpy('removeWebhook').and.returnValue(Observable.of({})),
    getLinkedRepos: jasmine.createSpy('getLinkedRepos').and.returnValue(Observable.of(linkedRepos)),
    getLinkedOrgs: jasmine.createSpy('getLinkedOrgs').and.returnValue(Observable.empty())
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

  describe('constructor', () => {
    it('should wait for all GitHub repos and orgs to be fetched(multiple pages) and then notify the observers', fakeAsync(() => {
      expect(homeService.getLinkedRepos()).toEmitValues(testData.linkedRepos);
    }));
  });

  describe('link', () => {
    it('should add a webhook for the newly linked cla', fakeAsync(() => {
      claBackendServiceMock.linkRepo.and.returnValue(Observable.of(testData.linkedRepos[0]));
      homeService.link(testData.gists[0], testData.githubRepos[0]).subscribe();
      expect(claBackendServiceMock.addWebhook).toHaveBeenCalledWith(testData.linkedRepos[0]);
    }));
    it('should add the newly linked cla to the list of linked items', fakeAsync(() => {
      claBackendServiceMock.linkRepo.and.returnValue(Observable.of(testData.linkedRepos[0]));
      homeService.link(testData.gists[0], testData.githubRepos[0]).subscribe();
      claBackendServiceMock.linkRepo.and.returnValue(Observable.of(testData.linkedRepos[1]));
      homeService.link(testData.gists[1], testData.githubRepos[1]).subscribe();

      homeService.getLinkedRepos().subscribe(
        repos => expect(repos.slice(-2)).toEqual([testData.linkedRepos[0], testData.linkedRepos[1]],
          'Expected newly linked repos to be added to the end of the linked repos list')
      );
    }));
  });

  describe('unlinkItem', () => {
    it('should remove the linked cla from the list of linked items', fakeAsync(() => {
      claBackendServiceMock.linkRepo.and.returnValue(Observable.of(testData.linkedRepos[0]));
      homeService.link(testData.gists[0], testData.githubRepos[0]).subscribe();
      homeService.unlinkItem(testData.linkedRepos[0]);

      homeService.getLinkedRepos().subscribe(
        repos => expect(repos).not.toContain(testData.linkedRepos[0],
          'Expected list of linked repos not to include the removed item'
        )
      );
    }));

    it('should remove the webhook of the removed item', fakeAsync(() => {
      homeService.unlinkItem(testData.linkedRepos[0]);
      expect(claBackendServiceMock.removeWebhook).toHaveBeenCalledWith(testData.linkedRepos[0]);
    }));
  });
});
