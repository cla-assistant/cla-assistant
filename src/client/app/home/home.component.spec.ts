import { beforeEachProviders, inject, async, ComponentFixture } from '@angular/core/testing';
import { OverridingTestComponentBuilder } from '@angular/compiler/testing';
import { provide } from '@angular/core';
import { createFakeObservable } from '../testUtils/observable';


import { Home } from './home.component';
import { AuthService } from '../login/auth.service';
import { HomeCacheService } from './homeCache.service';

describe('Home Component', () => {
  let fixture: ComponentFixture<Home>;

  const testUser = {};
  const authServiceMock = jasmine.createSpyObj('AuthServiceMock', ['doLogout']);
  const homeCacheServiceMock = {
    currentUser: createFakeObservable(testUser)
  };

  beforeEachProviders(() => [
    OverridingTestComponentBuilder,
    provide(AuthService, { useValue: authServiceMock })
  ]);

  beforeEach(async(inject([OverridingTestComponentBuilder], (tcb: OverridingTestComponentBuilder) => {
    return tcb
      .overrideTemplate(Home, '<div></div>')
      .overrideProviders(Home, [provide(HomeCacheService, { useValue: homeCacheServiceMock })])
      .createAsync(Home)
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
