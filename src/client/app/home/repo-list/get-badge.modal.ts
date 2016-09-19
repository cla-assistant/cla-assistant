import { Component, ViewChild, OnInit, Output, Input, EventEmitter, Inject, ElementRef } from '@angular/core';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { ClaRepo } from '../../shared/claBackend/repo';

type DropdownItem = { id: number, text: string, url: string };

@Component({
  selector: 'get-badge-modal',
  templateUrl: './get-badge.modal.html'
})
export class GetBadgeModal implements OnInit {
  @ViewChild(ModalComponent)
  private modal: ModalComponent;
  @ViewChild('copyButton')
  private copyButton: ElementRef;
  @Input()
  private repo: ClaRepo;
  private types: Array<DropdownItem>;
  private selectedType: DropdownItem;
  private badgeUrl: string;

  public constructor( @Inject('Window') private window: Window) {

  }

  public ngOnInit() {
    let badgeUrl = this.window.location + 'readme/badge/' + this.repo.owner + '/' + this.repo.repo;
    this.badgeUrl = badgeUrl;
    let linkUrl = this.window.location + this.repo.owner + '/' + this.repo.repo;
    this.types = [
      {
        id: 1,
        text: 'HTML',
        url: '<a href="' + linkUrl + '"><img src="' + badgeUrl + '" alt="CLA assistant" /></a>'
      },
      {
        id: 2,
        text: 'Image URL',
        url: badgeUrl
      },
      {
        id: 3,
        text: 'Markdown',
        url: '[![CLA assistant](' + badgeUrl + ')](' + linkUrl + ')'
      },
      {
        id: 4,
        text: 'Textile',
        url: '!' + badgeUrl + '(CLA assistant)!:' + linkUrl
      },
      {
        id: 5,
        text: 'RDOC',
        url: '{<img src="' + badgeUrl + '" alt="CLA assistant" />}[' + linkUrl + ']'
      }
    ];
    this.selectedType = this.types[0];

    const clipboard = new Clipboard(this.copyButton.nativeElement, {
      text: () => {
        return this.selectedType.url
      }

    });
  }

  private typeSelected(item: DropdownItem) {
    this.selectedType = this.types[item.id - 1];
  }

  public open() {
    this.modal.open();
  }
}
