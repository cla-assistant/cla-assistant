import { TestBed, inject, async, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { AppFrameComponent } from './app-frame.component';
import { User } from '../shared/github/user';

describe('AppFrame', () => {
  let fixture: ComponentFixture<AppFrameComponent>;
  const testUser: User = {
    htmlUrl: 'test html url',
    avatarUrl: 'test avatar url',
    login: 'TestUser',
    roles: { admin: true, orgAdmin: true }
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppFrameComponent],
      providers: []
    });
  });
  beforeEach(async(() => {
     TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(AppFrameComponent);
     });
  }));

  it('should greet the user', () => {
    let appFrame: AppFrameComponent = fixture.componentInstance;
    appFrame.user = testUser;
    fixture.detectChanges();

    let greetText: HTMLElement = fixture.nativeElement.querySelector('#app-frame-user-greet > a');
    expect(greetText.innerHTML).toEqual('&nbsp; Hey, <b>TestUser</b>!');
  });

  it('should emit a logout event when the logout button is clicked', fakeAsync(() => {
    const appFrame: AppFrameComponent = fixture.componentInstance;
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
