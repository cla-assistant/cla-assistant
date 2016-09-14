import { Component, ViewChild, Output, Input, EventEmitter } from '@angular/core';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { GithubRepo } from '../../shared/github/repo';
import { GithubOrg } from '../../shared/github/org';
import { Gist } from '../../shared/github/gist';


@Component({
  selector: 'confirm-add-modal',
  template: `
    <modal class="confirm-add">
      <modal-body class="modal-primary" *ngIf="visible">
        <div (click)="cancel()" class="fa fa-times close-button"></div>
        <div class="row" style="text-align: center; font-size:26px; margin-top: 20px;">
            Would you like to link this CLA<br> to your {{item.fullName ? 'repository' : 'organization'}}?
        </div>

        <div class="row" style="margin:50px; margin-bottom: 20px;">
          <div class="col-sm-12 well center-block">
            <img src="/assets/images/popup_link.svg" class="icon">
            <p class="col-sm-6">{{gist.fileName}}</p>
            <p class="col-sm-6">{{item.fullName ? item.fullName : item.login}}</p>
          </div>
        </div>

        <div class="center-block row" style="font-size:18px;">
          CLA assistant will...
        <ul class="col-sm-8 col-sm-offset-3" style="text-align:left">
          <li>Create a webhook in your {{item.fullName ? 'repository' : 'organization'}} and listen for pull requests</li>
          <li>Set a pull request CLA status</li>
          <li>Comment on pull requests</li>
        </ul>
        </div>

        <div style="text-align:right; margin-top: 50px; margin-bottom: 15px; margin-right: 10px;">
          <button class="btn btn-cancel" (click)="cancel()">Cancel</button>
          <button class="btn btn-success" (click)="confirm()">Yes, let's do this!</button>
        </div>
      </modal-body>
    </modal>
  `
})
export class ConfirmAddModal {
  @Output() public onClose = new EventEmitter<boolean>();
  @Input() public gist: Gist;
  @Input() public item: GithubRepo | GithubOrg;

  @ViewChild(ModalComponent)
  private modal: ModalComponent;

  private visible = false;

  public open() {
    this.visible = true;
    this.modal.open();
    return this.onClose;
  }
  public confirm() {
    this.modal.close();
    this.visible = false;
    this.onClose.emit(true);
  }
  public cancel() {
    this.modal.close();
    this.visible = false;
    this.onClose.emit(false);
  }
}
