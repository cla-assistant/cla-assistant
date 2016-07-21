import { beforeEachProviders, inject, async } from '@angular/core/testing';
import { provide } from '@angular/core';
import { MockBackend } from '@angular/http/testing';
import { getHttpMockServices, setupFakeConnection } from '../test-utils/http';
import { createFakeObservable } from '../test-utils/observable';

import { HomeCacheService } from './home-cache.service';
import { GithubService } from '../shared/github/github.service';


class GithubServiceMock {
  public fakeUser: { login: 'testUser' };
  public getUserObservable = createFakeObservable(this.fakeUser);
  public getUser() { return this.getUserObservable; }

  public fakeGists: [{ name: 'gist1' }, { name: 'gist2' }];
  public getUserGistsObservable = createFakeObservable(this.fakeGists);
  public getUserGists() { return this.getUserGistsObservable; }

  public fakeRepos: [{ fullName: 'repo1' }, { fullName: 'repo2' }];
  public getUserReposObservable = createFakeObservable(this.fakeRepos);
  public getUserRepos() { return this.getUserReposObservable; }
};

describe('Home Cache Service', () => {
  let homeCacheService: HomeCacheService, mockBackend: MockBackend;
  const githubServiceMock = new GithubServiceMock();

  beforeEachProviders(() => [
    HomeCacheService,
    provide(GithubService, { useValue: githubServiceMock }),

    ...getHttpMockServices()
  ]);

  beforeEach(inject([HomeCacheService, MockBackend], (hs, mb) => {
    homeCacheService = hs;
    mockBackend = mb;
  }));

  describe('defaultGists', () => {
    it('should return the default CLAs', async(() => {
      const expectedUrl = '/static/cla-assistant.json';
      const expectedResponse = [
        {
          name: 'SAP individual CLA',
          url: 'https://gist.github.com/CLAassistant/bd1ea8ec8aa0357414e8'
        }];
      const fakeResponseBody = {};
      fakeResponseBody['default-cla'] = expectedResponse;

      setupFakeConnection(mockBackend, {
        expectedUrl,
        fakeResponseBody
      });
      homeCacheService.defaultGists.subscribe((result) => {
        expect(result).toEqual(expectedResponse);
      });
    }));
  });

  describe('currentUser', () => {

    it('it should get the current user from the github serive and cache the result', () => {
      homeCacheService.currentUser.subscribe((user) => {
        expect(user).toBe(githubServiceMock.fakeUser);
      });
      expect(githubServiceMock.getUserObservable.getTimesUsed())
        .toEqual(1, 'Did not request the user on first access');
      // Second time should be cached and not call the github service again
      homeCacheService.currentUser.subscribe((user) => {
        expect(user).toBe(githubServiceMock.fakeUser);
      });
      expect(githubServiceMock.getUserObservable.getTimesUsed())
        .toEqual(1, 'Did not cache the user on second access');
    });
  });

  describe('currentUserGists', () => {
    it('it should get the current user\'s gists from the github serive and cache the result', () => {
      homeCacheService.currentUserGists.subscribe((gist) => {
        expect(gist).toBe(githubServiceMock.fakeGists);
      });
      expect(githubServiceMock.getUserGistsObservable.getTimesUsed())
        .toEqual(1, 'Did not request the user\'s gists on first access');
      // Second time should be cached and not call the github service again
      homeCacheService.currentUserGists.subscribe((gist) => {
        expect(gist).toBe(githubServiceMock.fakeGists);
      });
      expect(githubServiceMock.getUserGistsObservable.getTimesUsed())
        .toEqual(1, 'Did not cache the user\'s gists on second access');
    });
  });

  describe('currentUserRepos', () => {
    it('it should get the current user\'s repos from the github serive and cache the result', () => {
      homeCacheService.currentUserRepos.subscribe((repos) => {
        expect(repos).toBe(githubServiceMock.fakeRepos);
      });
      expect(githubServiceMock.getUserReposObservable.getTimesUsed())
        .toEqual(1, 'Did not request the user\'s repos on first access');
      // Second time should be cached and not call the github service again
      homeCacheService.currentUserRepos.subscribe((repos) => {
        expect(repos).toBe(githubServiceMock.fakeRepos);
      });
      expect(githubServiceMock.getUserReposObservable.getTimesUsed())
        .toEqual(1, 'Did not cache the user\'s repos on second access');
    });
  });
});
