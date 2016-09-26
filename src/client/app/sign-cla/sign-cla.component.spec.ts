import { TestBed, inject, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { CustomFieldComponent } from './custom-field.component';
import { SignClaComponent } from './sign-cla.component';
import { AppFrameModule } from '../app-frame/app-frame.module';
import { User } from '../shared/github/';
import { ClaBackendService } from '../shared/claBackend';
import { GithubCacheService } from '../shared/github';
import { ActivatedRoute } from '@angular/router';

const createActiveRouteMock = () => ({
  snapshot: {
    params: {
      user: 'TestUser',
      repo: 'TestRepo',
      pullRequest: '15',
      redirect: false
    }
  }
});
const createClaBackendServiceMock = () => jasmine.createSpyObj('claBackendServiceMock', [
  'getSignatureValues', 'checkCla', 'signCla', 'getGistContentByName'
]);
const createGithubCacheServiceMock = () => jasmine.createSpyObj('githubCacheServiceMock', [
  'getCurrentUser', 'getCurrentUserPrimaryEmail'
]);
const createWindowMock = () => ({
  location: {
    replace: jasmine.createSpy('replace')
  }
});

const testUser: User = {
  avatarUrl: 'testAvatarUrl',
  htmlUrl: 'testUrl',
  login: 'testName',
  roles: { admin: true, orgAdmin: true }
};
const testCustomFields = {
  Name: { title: 'Name', description: 'Name of user', type: 'string', required: true, githubKey: 'login' },
  Email: { title: 'Email', description: 'Email Address', type: 'string', githubKey: 'email' },
  Age: { title: 'Age', description: 'Age', type: 'number' },
  Checkbox: { title: 'Checkbox', description: 'Test Checkbox', type: 'boolean', required: true },
  Enum: { title: 'Enum', description: 'Test Enum', type: { enum: ['option1', 'option2'] } }
};

describe('Sign Cla Component', () => {
  let fixture: ComponentFixture<SignClaComponent>;
  let activeRouteMock = createActiveRouteMock();
  let claBackendServiceMock = createClaBackendServiceMock();
  let githubCacheServiceMock = createGithubCacheServiceMock();
  let windowMock = createWindowMock();

  // Initializes component with specific state
  function initTest(config: {
    redirect?: boolean,
    pullRequest?: string,
    hasSigned?: boolean,
    customFields?: Object,
    signatureValues?: Object,
    claText?: string,
    loggedInUser?: User,
    getGistContentError?: boolean,
    getUserError?: boolean
  }) {
    activeRouteMock.snapshot.params.redirect = config.redirect;
    activeRouteMock.snapshot.params.pullRequest = config.pullRequest;
    claBackendServiceMock.checkCla.and.returnValue(Observable.of(config.hasSigned));
    if (config.getGistContentError) {
      claBackendServiceMock.getGistContentByName.and.returnValue(Observable.throw('GistContentError'));
    } else {
      const claData = {
        claText: config.claText,
        hasCustomFields: Object.keys(config.customFields).length > 0,
        customFields: config.customFields,
        customKeys: Object.keys(config.customFields)
      };
      claBackendServiceMock.getGistContentByName.and.returnValue(Observable.of(claData));
    }
    claBackendServiceMock.getSignatureValues.and.returnValue(Observable.of(config.signatureValues));
    claBackendServiceMock.signCla.and.returnValue(Observable.of(true));
    if (config.getUserError) {
      githubCacheServiceMock.getCurrentUser.and.returnValue(Observable.throw('UserError'));
    } else {
      githubCacheServiceMock.getCurrentUser.and.returnValue(Observable.of(config.loggedInUser));
      githubCacheServiceMock.getCurrentUserPrimaryEmail.and.returnValue(Observable.of('test@mail.com'));
    }

    fixture = TestBed.createComponent(SignClaComponent);
    fixture.detectChanges();
  }

  // Creates new mocks for each test and configures provider
  beforeEach(() => {
    activeRouteMock = createActiveRouteMock();
    claBackendServiceMock = createClaBackendServiceMock();
    githubCacheServiceMock = createGithubCacheServiceMock();
    windowMock = createWindowMock();

    TestBed.configureTestingModule({
      imports: [AppFrameModule],
      declarations: [SignClaComponent, CustomFieldComponent],
      providers: [
        { provide: ClaBackendService, useValue: claBackendServiceMock },
        { provide: GithubCacheService, useValue: githubCacheServiceMock },
        { provide: ActivatedRoute, useValue: activeRouteMock },
        { provide: 'Window', useValue: windowMock }
      ]
    });
  });

  // Page access functions
  function getClaHeaderText(): DebugElement {
    return fixture.debugElement.query(By.css('#cla-header h4'));
  }
  function getAgreeButton(): DebugElement {
    return fixture.debugElement.query(By.css('#button-agree-cla'));
  }
  function getSignInAndAgreeButton(): DebugElement {
    return fixture.debugElement.query(By.css('#button-sign-in-and-agree'));
  }
  function getSignInButton(): DebugElement {
    return fixture.debugElement.query(By.css('#button-sign-in'));
  }
  function getNameInput(): DebugElement {
    return fixture.debugElement.query(By.css('#Name input'));
  }
  function getEmailInput(): DebugElement {
    return fixture.debugElement.query(By.css('#Email input'));
  }
  function getAgeInput(): DebugElement {
    return fixture.debugElement.query(By.css('#Age input'));
  }
  function getCheckboxInput(): DebugElement {
    return fixture.debugElement.query(By.css('#Checkbox input'));
  }
  function getTankYouText(): DebugElement {
    return fixture.debugElement.query(By.css('#thank-you-text'));
  }
  function getErrorHeader(): DebugElement {
    return fixture.debugElement.query(By.css('#error-header'));
  }
  function getErrorReason(): DebugElement {
    return fixture.debugElement.query(By.css('#error-reason'));
  }
  function submitClaForm() {
    const event = { preventDefault: jasmine.createSpy('preventDefault') };
    const form = fixture.debugElement.query(By.css('#cla-form'));
    form.triggerEventHandler('submit', event);
    expect(event.preventDefault).toHaveBeenCalled();
  }


  describe('when cla does not have custom fields', () => {
    describe('and user has not signed cla', () => {
      beforeEach(() => {
        initTest({
          redirect: false,
          pullRequest: '15',
          hasSigned: false,
          customFields: {},
          claText: 'Test Cla Text',
          loggedInUser: null
        });
      });
      it('should show "Plase sign the Cla for ..." text', () => {
        expect(getClaHeaderText().nativeElement.innerText).toEqual('Please sign the CLA for TestUser/TestRepo');
      });
      it('should show sign in and agree button', () => {
        expect(getSignInAndAgreeButton() != null).toBeTruthy('Sign in and agree button not visible!');
      });
      it('should redirect to agree url when form is submitted', () => {
        submitClaForm();
        expect(windowMock.location.replace).toHaveBeenCalledWith('/accept/TestUser/TestRepo?pullRequest=15');
      });
    });
    describe('and user has signed cla', () => {
      describe('and redirect query parameter is set', () => {
        beforeEach(() => {
          initTest({
            redirect: true,
            pullRequest: '15',
            hasSigned: true,
            customFields: {},
            claText: 'Test Cla Text',
            loggedInUser: testUser
          });
        });
        it('should redirect after 5 seconds if redirect parameter is set', fakeAsync(() => {
          fixture.componentInstance.ngOnInit(); // call ngOnInit manually to fake time in setTimeout
          expect(windowMock.location.replace).not.toHaveBeenCalled();
          tick(5000);
          const url = 'https://github.com/TestUser/TestRepo/pull/15';
          expect(windowMock.location.replace).toHaveBeenCalledWith(url);
        }));
        it('should should show thank you text', () => {
          expect(getTankYouText().nativeElement.innerText).toBe('Thank you testName');
        });
      });
      describe('and redirect query parameter is not set', () => {
        beforeEach(() => {
          initTest({
            redirect: false,
            hasSigned: true,
            customFields: {},
            claText: 'Test Cla Text',
            loggedInUser: null
          });
        });
        it('should show "You have signed the CLA for ..." text', () => {
          expect(getClaHeaderText().nativeElement.innerText).toEqual('You have signed the CLA for TestUser/TestRepo');
        });
        it('should not show agree button', () => {
          expect(getSignInAndAgreeButton() == null).toBeTruthy('Agree button is visible!');
        });
      });
    });
  });

  describe('when cla has custom fields', () => {
    describe('and user is not logged in', () => {
      beforeEach(() => {
        initTest({
          redirect: false,
          pullRequest: '15',
          hasSigned: false,
          customFields: testCustomFields,
          claText: 'Test Cla Text',
          loggedInUser: null
        });
      });
      it('should show github sign in button', () => {
        expect(getSignInButton() != null).toBeTruthy('Sign in button is not visible!');
      });
      it('should redirect to sign in url when sign in button is clicked', () => {
        getSignInButton().triggerEventHandler('click', null);
        expect(windowMock.location.replace).toHaveBeenCalledWith('/signin/TestUser/TestRepo?pullRequest=15');
      });
      it('should not show agree button', () => {
        expect(getAgreeButton() == null).toBeTruthy('Agree button is visible!');
      });
    });
    describe('and user is logged in', () => {
      describe('and cla is not signed', () => {
        beforeEach(() => {
          initTest({
            redirect: false,
            hasSigned: false,
            customFields: testCustomFields,
            claText: 'Test Cla Text',
            loggedInUser: testUser
          });
        });
        it('should show custom fields', () => {
          expect(getNameInput() != null).toBeTruthy('Custom name field not visible!');
          expect(getEmailInput() != null).toBeTruthy('Custom email field not visible!');
        });
        it('should fill out custom field with githubKey', () => {
          expect(getNameInput().nativeElement.value).toBe('testName', 'Custom Field not filled in correctly with github user data');
        });
        it('should make request if email is not available on user object', () => {
          expect(getEmailInput().nativeElement.value).toBe('test@mail.com', 'Custom Field not filled with correct email address');
        });
        it('should disable agree button if not all required fields are filled in', () => {
          expect(getAgreeButton().nativeElement.disabled).toBeTruthy();
        });
        it('should enable agree button if all required fields are filled in', () => {
          getNameInput().triggerEventHandler('input', { target: { value: 'octocat' } });
          getCheckboxInput().triggerEventHandler('change', { target: { checked: true } });
          fixture.detectChanges();
          expect(getAgreeButton().nativeElement.disabled).toBeFalsy();
        });
        it('should accept number in number input', () => {
          getAgeInput().triggerEventHandler('input', { target: { value: '18' } });
          fixture.detectChanges();
          expect(getAgeInput().nativeElement.value).toBe('18');
        });
        it('should not accept letters in number input', () => {
          getAgeInput().triggerEventHandler('input', { target: { value: 'abc' } });
          fixture.detectChanges();
          expect(getAgeInput().nativeElement.value).toBe('');
        });
        it('should use textbox for string type', () => {
          expect(getEmailInput().nativeElement.type).toBe('text');
        });
        it('should use checkbox for boolean type', () => {
          expect(getCheckboxInput().nativeElement.type).toBe('checkbox');
        });
        it('should use one radio button for each enum option', () => {
          const options = fixture.debugElement.queryAll(By.css('#Enum input'));
          expect(options.length).toEqual(2);
          expect(options[0].nativeElement.value).toEqual('option1');
          expect(options[0].nativeElement.type).toEqual('radio');
          expect(options[1].nativeElement.value).toEqual('option2');
          expect(options[1].nativeElement.type).toEqual('radio');
        });
        it('should sign cla and redirect after 5 seconds', fakeAsync(() => {
          expect(windowMock.location.replace).not.toHaveBeenCalled();
          submitClaForm();
          tick(5000);
          expect(windowMock.location.replace).toHaveBeenCalledWith('https://github.com/TestUser/TestRepo');
        }));
      });
      describe('and cla is signed', () => {
        beforeEach(() => {
          initTest({
            redirect: false,
            hasSigned: true,
            customFields: testCustomFields,
            signatureValues: {
              Name: 'Octocat', Email: 'test@mail.com'
            },
            claText: 'Test Cla Text',
            loggedInUser: testUser
          });
        });
        it('should show custom fields and disable input', () => {
          expect(getNameInput().nativeElement.disabled).toBeTruthy('Custom name field is enabled!');
          expect(getEmailInput().nativeElement.disabled).toBeTruthy('Custom email field is enabled!');
        });
      });
    });
  });

  describe('when error occurs', () => {
    it('should show error message on unexpected error', () => {
      initTest({
        getGistContentError: true
      });
      expect(getErrorHeader().nativeElement.innerText).toBe('There is no CLA to sign for TestUser/TestRepo');
      expect(getErrorReason().nativeElement.innerText).toBe('(GistContentError)');
    });
    it('should continue without user if user request fails', () => {
      initTest({
        redirect: false,
        hasSigned: false,
        customFields: {},
        claText: 'Test Cla Text',
        getUserError: true
      });
      expect(fixture.componentInstance.isUserSignedIn()).toBeFalsy();
    });
  });

});
