import { beforeEachProviders, inject, async, ComponentFixture } from '@angular/core/testing';
import { OverridingTestComponentBuilder } from '@angular/compiler/testing';
import { provide } from '@angular/core';
import { Observable } from 'rxjs';

import { Home } from './home.component';
import { AuthService } from '../login/auth.service';
import { GithubService } from '../shared/github/github.service';



describe('Home', () => {
  let fixture: ComponentFixture<Home>;

  const authServiceMock = jasmine.createSpyObj('AuthServiceMock', ['doLogout']);
  const githubServiceMock = jasmine.createSpyObj('GithubServiceMock', ['getUser']);
  const testUser = {};
  githubServiceMock.getUser.and.returnValue(Observable.of(testUser));

  beforeEachProviders(() => [
    OverridingTestComponentBuilder,
    provide(AuthService, { useValue: authServiceMock }),
    provide(GithubService, { useValue: githubServiceMock })
  ]);

  beforeEach(async(inject([OverridingTestComponentBuilder], (tcb: OverridingTestComponentBuilder) => {
    return tcb
      .overrideTemplate(Home, '<div></div>')
      .createAsync(Home)
      .then(f => fixture = f);
  })));

  it('should request the current user on init', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.user).toBe(testUser);
    expect(githubServiceMock.getUser).toHaveBeenCalledTimes(1);
  });
});
