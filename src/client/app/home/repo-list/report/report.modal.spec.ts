import { Component, ViewChild } from '@angular/core';
import { TestBed, inject, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ClaBackendService, LinkedItem, LinkedRepo, Signature } from '../../../shared/claBackend';
import { Gist } from '../../../shared/github';


import { ReportModal } from './report.modal';
import { VersionDropdownComponent } from './version-dropdown.component';
import { CsvDownloadService } from './csv-download.service';
import { SelectModule } from 'ng2-select';

const createClaBackendServiceMock = () => jasmine.createSpyObj('claBackendServiceMock', [
  'getClaSignatures'
]);
const createCsvDownloadServiceMock = () => jasmine.createSpyObj('csvDownloadServiceMock', [
  'downloadAsCsv'
]);

describe('Report modal dialog', () => {
  let fixture: ComponentFixture<TestComponent>;
  let claBackendServiceMock;
  let csvDownloadServiceMock;

  function initTest(config: {
    signatures: Observable<{}>
  }) {
    claBackendServiceMock.getClaSignatures.and.returnValue(config.signatures);
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
  }

  // Creates new mocks for each test and configures provider
  beforeEach(() => {
    claBackendServiceMock = createClaBackendServiceMock();
    csvDownloadServiceMock = createCsvDownloadServiceMock();

    TestBed.configureTestingModule({
      imports: [NgbModule, SelectModule],
      declarations: [TestComponent, ReportModal, VersionDropdownComponent],
      providers: [
        { provide: ClaBackendService, useValue: claBackendServiceMock },
        { provide: CsvDownloadService, useValue: csvDownloadServiceMock }
      ]
    });
  });

  it('should be visible when open is called', () => {
    initTest({
      signatures: Observable.of([])
    });
    fixture.componentInstance.reportModal.open();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('#report-modal'))).not.toBeNull();
  });

  it('should select the latest version by default', () => {
    initTest({
      signatures: Observable.of([])
    });
    fixture.componentInstance.reportModal.open();
    fixture.detectChanges();
    expect(claBackendServiceMock.getClaSignatures).toHaveBeenCalledWith(
      fixture.componentInstance.item,
      fixture.componentInstance.gist.history[0].version
    );
  });

  it('should show a loading screen while the request is pending', () => {
    initTest({
      signatures: Observable.never()
    });
    fixture.componentInstance.reportModal.open();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('#loading-animation'))).not.toBeNull();
  });

  it('should download csv on button click', () => {
    const signatures: Signature[] = [{
        user_name: 'testUser',
        repo_owner: 'restOwner',
        repo_name: 'testName',
        gist_name: 'myGist.txt',
        gist_url: 'gistUrl',
        gist_version: '1.2',
        signed_at: 'Fri Apr 15 1988 00:00:00 GMT-0700',
        org_cla: false,
        custom_fields: {
          customField1: 'value1',
          customField2: 'value1'
        }
    }];
    initTest({
      signatures: Observable.of(signatures)
    });
    fixture.componentInstance.reportModal.open();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.export-button button')).triggerEventHandler('click', null);
    expect(csvDownloadServiceMock.downloadAsCsv).toHaveBeenCalledWith(
      'cla-assistant.csv',
      signatures,
      ['user_name', 'repo_owner', 'repo_name', 'gist_name', 'gist_url',
       'gist_version', 'signed_at', 'org_cla', 'customField1', 'customField2'],
      ['User Name', 'Repository Owner', 'Repository Name', 'CLA Title', 'Gist URL',
       'Gist Version', 'Signed At', 'Signed for Organisation', 'customField1', 'customField2']
    );
  });
});

@Component({
  template: `
    <div>
      <template ngbModalContainer></template>
      <report-modal [claItem]="item" [gist]="gist"></report-modal>
    </div>
  `
})
class TestComponent {
  @ViewChild(ReportModal) public reportModal;
  public item: LinkedItem = new LinkedRepo({
    fork: false,
    gist: 'gistUrl',
    owner: 'testOwner',
    repo: 'testRepo',
    repoId: '1234'
  });
  public gist: Gist = {
    fileName: 'myGist.txt',
    updatedAt: 'date',
    url: 'gistUrl',
    history: [
      { version: '1.2' },
      { version: '1.1' },
      { version: '1.0' }
    ]
  };
}
