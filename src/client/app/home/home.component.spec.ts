import { TestBed, inject, async, ComponentFixture } from '@angular/core/testing';
import { OverridingTestComponentBuilder } from '@angular/compiler/testing';
import { Observable } from 'rxjs/Observable';

import { HomeComponent } from './home.component';
import { AuthService } from '../login/auth.service';
import { GithubCacheService } from '../shared/github';
import { HomeService } from './home.service';

describe('Home Component', () => {
  let fixture: ComponentFixture<HomeComponent>;

  const testUser = {};
  const authServiceMock = jasmine.createSpyObj('AuthServiceMock', ['doLogout']);
  const githubCacheServiceMock = {
    getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(Observable.empty())
  };
  const homeServiceMock = jasmine.createSpyObj('homeServiceMock', [
    'requestReposFromBackend',
    'requestOrgsFromBackend'
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        {provide: AuthService, useValue: authServiceMock },
        {provide: GithubCacheService, useValue: githubCacheServiceMock },
        {provide: HomeService, useValue: homeServiceMock }
      ]
    });
  });
  beforeEach(async(() => {
    TestBed.overrideComponent(HomeComponent, {
      set: {
        template: `<div></div>`
      }
    }).compileComponents().then(() => {
      fixture = TestBed.createComponent(HomeComponent);
    });
  }));

  it('should request the current user on init', () => {
    fixture.detectChanges();
    expect(githubCacheServiceMock.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  describe('handleLogout', () => {
    it('should log out the user', () => {
      fixture.componentInstance.handleLogout();
      expect(authServiceMock.doLogout).toHaveBeenCalledTimes(1);
    });
  });

});
