import { Component, ViewChild, Output, Input, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GithubRepo } from '../../shared/github/repo';
import { GithubOrg } from '../../shared/github/org';
import { Gist } from '../../shared/github/gist';


@Component({
  selector: 'confirm-remove-modal',
  template: `
    <template  #modalContent let-c="close">
     <div class="confirm-add">
        <div class="modal-body modal-primary">
          <div (click)="c(false)" class="fa fa-times close-button"></div>
            <div class="row" style="text-align: center; font-size:26px; margin-top: 20px;">
                Are you sure you want to unlink?
            </div>

            <div class="row" style="margin:50px; margin-bottom: 20px;">
              <div class="col-sm-12 card card-block m-x-auto" style="position: relative; left: 0; top: 0;">
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

            <div class="m-x-auto row" style="font-size:18px;">
              Unlinking will...
            <ul class="col-sm-9 offset-sm-2" style="text-align:left">
              <li>Remove the CLA assistant webhook in your repository/organization</li>
              <li>Remove the link to your list of contributors</li>
            </ul>
            </div>

            <div style="text-align:right; margin-top: 50px; margin-bottom: 15px; margin-right: 10px;">
              <button class="btn btn-cancel" (click)="c(false)">Keep it</button>
              <button 
                class="btn btn-danger"
                (click)="c(true)"
                (mouseenter)="isNervous=true" 
                (mouseleave)="isNervous=false">
                Unlink anyway
              </button>
            </div>
        </div>
      </div>
    </template>
  `
})
export class ConfirmRemoveModal {
  @ViewChild('modalContent')
  private content;
  private isNervous = false;

  constructor(private modalService: NgbModal) { }

  public open() {
    return this.modalService.open(this.content, {
      size: 'lg'
    }).result.catch(() => false);
  }
}
