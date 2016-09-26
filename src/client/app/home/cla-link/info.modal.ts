import { Component, ViewChild } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'info-modal',
  template: `
    <template #modalContent let-c="close" >
      <div class="howto"  id="info-modal">
        <div class="modal-body">
          <div (click)="c()" class="fa fa-times close-button"></div>
          <div class="free-space">
            <h4>How can I create a CLA Gist?</h4>
            <div>
              At <a href="http://gist.github.com" target="_blank" class="text-primary">gist.github.com</a>
              enter a file name and paste the content of your CLA.
            </div>
          </div>
          <div class="free-space">
            <h4>What happens if I edit the Gist file?</h4>
            <div>  
              CLA assistant will always show you the current version of your Gist file.
              Users who accept your CLA sign the current version.
              If you change the content of your CLA, each contributor has to accept the new version when they create a new pull request. 
            </div>
          </div>
        </div>
      </div>
    </template>
  `
})
export class InfoModal {
  @ViewChild('modalContent')
  private content;

  constructor(private modalService: NgbModal) { }

  public open() {
    this.modalService.open(this.content).result.catch(() => {});
  }
}
