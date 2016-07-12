import { beforeEachProviders, TestComponentBuilder, inject, async, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { AppFrame } from './appFrame.component';
import { User } from '../shared/github/user';

describe('AppFrame', () => {
  let fixture: ComponentFixture<AppFrame>;
  const testUser: User = {
    htmlUrl: 'test html url',
    avatarUrl: 'test avatar url',
    login: 'TestUser',
    roles: { admin: true, orgAdmin: true }
  };

  beforeEachProviders(() => [
    TestComponentBuilder
  ]);
  beforeEach(async(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
    return tcb
      .createAsync(AppFrame)
      .then(f => fixture = f);
  })));

  it('should greet the user', () => {
    let appFrame: AppFrame = fixture.componentInstance;
    appFrame.user = testUser;
    fixture.detectChanges();

    let greetText: HTMLElement = fixture.nativeElement.querySelector('#app-frame-user-greet > a');
    expect(greetText.innerHTML).toEqual('&nbsp; Hey, <b>TestUser</b>!');
  });

  it('should emit a logout event when the logout button is clicked', fakeAsync(() => {
    const appFrame: AppFrame = fixture.componentInstance;
    const onLogout = jasmine.createSpy('onLogout');
    appFrame.logout.subscribe(onLogout);
    appFrame.user = testUser;
    fixture.detectChanges();
    let logoutButton: HTMLElement = fixture.nativeElement.querySelector('#app-frame-logout-button');
    logoutButton.click();
    tick();
    expect(onLogout).toHaveBeenCalledTimes(1);
  }));

  it('should only render header and footer when no user is provided', () => {
    let greetElement: HTMLElement = fixture.nativeElement.querySelector('#app-frame-user-greet');
    let logoutButton: HTMLElement = fixture.nativeElement.querySelector('#app-frame-logout-button');
    expect(greetElement).toBeNull();
    expect(logoutButton).toBeNull();
  });
});
