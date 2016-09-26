import { TestBed, inject, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { InfoModal } from './info.modal';

xdescribe('Info modal dialog', () => {
  let fixture: ComponentFixture<InfoModal>;
  let infoModal: DebugElement;

  // Creates new mocks for each test and configures provider
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [InfoModal]
    });
  });

  it('should be visible when open is called', () => {
    const f = TestBed.createComponent(InfoModal);
    f.detectChanges();
    expect(document.documentElement.innerHTML).toBe(1);


    infoModal.componentInstance.open();
    fixture.detectChanges();
    expect(infoModal.query(By.css('#info-modal'))).not.toBeNull();
  });


});
