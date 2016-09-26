import { Component, ViewChild, Output, Input, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GithubRepo } from '../../shared/github/repo';
import { GithubOrg } from '../../shared/github/org';
import { Gist } from '../../shared/github/gist';


@Component({
  selector: 'confirm-add-modal',
  host: {'[class.confirm-add]': 'true'},
  template: `
    <template #modalContent let-c="close" >
      <div class="confirm-add">
        <div class="modal-body modal-primary">
          <div (click)="c(false)" class="fa fa-times close-button"></div>
          <div class="row" style="text-align: center; font-size:26px; margin-top: 20px;">
              Would you like to link this CLA<br> to your {{item.fullName ? 'repository' : 'organization'}}?
          </div>

          <div class="row" style="margin:50px; margin-bottom: 20px;">
            <div class="col-sm-12 card card-block m-x-auto">
              <img src="/assets/images/popup_link.svg" class="icon">
              <p class="col-sm-6">{{gist.fileName}}</p>
              <p class="col-sm-6">{{item.fullName ? item.fullName : item.login}}</p>
            </div>
          </div>

          <div class="m-x-auto row" style="font-size:18px;">
            CLA assistant will...
          <ul class="col-sm-8 offset-sm-3" style="text-align:left">
            <li>Create a webhook in your {{item.fullName ? 'repository' : 'organization'}} and listen for pull requests</li>
            <li>Set a pull request CLA status</li>
            <li>Comment on pull requests</li>
          </ul>
          </div>

          <div style="text-align:right; margin-top: 50px; margin-bottom: 15px; margin-right: 10px;">
            <button class="btn btn-cancel" (click)="c(false)">Cancel</button>
            <button class="btn btn-success" (click)="c(true)">Yes, let's do this!</button>
          </div>
        </div>
      </div>
    </template>
  `
})
export class ConfirmAddModal {
  @Input() public gist: Gist;
  @Input() public item: GithubRepo | GithubOrg;

  @ViewChild('modalContent')
  private content;

  constructor(private modalService: NgbModal) { }

  public open() {
    return this.modalService.open(this.content,{
      size: 'lg'
    }).result.catch(() => false);
  }
}
