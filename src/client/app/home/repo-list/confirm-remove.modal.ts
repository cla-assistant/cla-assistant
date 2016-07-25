import { Component, ViewChild, Output, Input, EventEmitter } from '@angular/core';
import { MODAL_DIRECTIVES, ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { GithubRepo } from '../../shared/github/repo';
import { GithubOrg } from '../../shared/github/org';
import { Gist } from '../../shared/github/gist';


@Component({
  selector: 'confirm-remove-modal',
  directives: [MODAL_DIRECTIVES],
  template: `
    <modal class="confirm-add">
      <modal-body class="modal-primary" *ngIf="visible">
        <div (click)="cancel()" class="fa fa-times close-button"></div>
          <div class="row" style="text-align: center; font-size:26px; margin-top: 20px;">
              Are you sure you want to unlink?
          </div>

          <div class="row" style="margin:50px; margin-bottom: 20px;">
            <div class="col-sm-12 well center-block" style="position: relative; left: 0; top: 0;">
              <div>
                  <img src="/assets/images/nervous_remove/nervous-36.svg" [class.nervous]="isNervous" style="position: relative;">
                  <img src="/assets/images/nervous_remove/nervous_eye1-37.svg" class="eye-move2">
                  <img src="/assets/images/nervous_remove/nervous_eye2-39.svg" class="eye-move">
                  <img src="/assets/images/nervous_remove/nervous_drop-38.svg" class="nervous-drop">
                  <img src="/assets/images/nervous_remove/nervous_drop-382.svg" 
                    style="width: 308px; margin-left: 20px;" class="nervous-drop2">
              </div>
            </div>
          </div>

          <div class="center-block row" style="font-size:18px;">
            Unlinking will...
          <ul class="col-sm-9 col-sm-offset-2" style="text-align:left">
            <li>Remove the CLA assistant webhook in your repository/organization</li>
            <li>Remove the link to your list of contributors</li>
          </ul>
          </div>

          <div style="text-align:right; margin-top: 50px; margin-bottom: 15px; margin-right: 10px;">
            <button class="btn btn-cancel" (click)="cancel()">Keep it</button>
            <button 
              class="btn btn-danger"
              (click)="confirm()"
              (mouseenter)="isNervous=true" 
              (mouseleave)="isNervous=false">
              Unlink anyway
            </button>
          </div>
      </modal-body>
    </modal>
  `
})
export class ConfirmRemoveModal {
  @Output() public onClose = new EventEmitter<boolean>();

  @ViewChild(ModalComponent)
  private modal: ModalComponent;

  private visible = false;
  private isNervous = false;

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
