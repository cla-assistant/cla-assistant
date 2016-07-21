import { beforeEachProviders, inject, async, ComponentFixture } from '@angular/core/testing';
import { OverridingTestComponentBuilder } from '@angular/compiler/testing';
import { provide } from '@angular/core';
import { createFakeObservable } from '../test-utils/observable';


import { HomeComponent } from './home.component';
import { AuthService } from '../login/auth.service';
import { HomeCacheService } from './home-cache.service';
import { HomeService } from './home.service';

describe('Home Component', () => {
  let fixture: ComponentFixture<HomeComponent>;

  const testUser = {};
  const authServiceMock = jasmine.createSpyObj('AuthServiceMock', ['doLogout']);
  const homeCacheServiceMock = {
    currentUser: createFakeObservable(testUser)
  };
  const homeServiceMock = jasmine.createSpyObj('homeServiceMock', ['requestReposFromBackend']);

  beforeEachProviders(() => [
    OverridingTestComponentBuilder,
    provide(AuthService, { useValue: authServiceMock })
  ]);

  beforeEach(async(inject([OverridingTestComponentBuilder], (tcb: OverridingTestComponentBuilder) => {
    return tcb
      .overrideTemplate(HomeComponent, '<div></div>')
      .overrideProviders(HomeComponent, [
        provide(HomeCacheService, { useValue: homeCacheServiceMock }),
        provide(HomeService, { useValue: homeServiceMock })
      ])
      .createAsync(HomeComponent)
      .then(f => fixture = f);
  })));

  afterEach(() => {
    homeCacheServiceMock.currentUser.resetTimesUsed();
  });

  it('should request the current user on init', () => {
    fixture.detectChanges();
    expect(homeCacheServiceMock.currentUser.getTimesUsed()).toEqual(1);
    expect(fixture.componentInstance.user).toBe(testUser);
  });

  describe('handleLogout', () => {
    it('should log out the user', () => {
      fixture.componentInstance.handleLogout();
      expect(authServiceMock.doLogout).toHaveBeenCalledTimes(1);
    });
  });

});
