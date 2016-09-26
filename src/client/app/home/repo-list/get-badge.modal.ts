import { Component, ViewChild, OnInit, Output, Input, EventEmitter, Inject, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClaRepo } from '../../shared/claBackend/repo';

type DropdownItem = { id: number, text: string, url: string };

@Component({
  selector: 'get-badge-modal',
  templateUrl: './get-badge.modal.html'
})
export class GetBadgeModal implements OnInit {
  @ViewChild('copyButton')
  private copyButton: ElementRef;
  @ViewChild('modalContent')
  private content;
  @Input()
  private repo: ClaRepo;
  private types: Array<DropdownItem>;
  private selectedType: DropdownItem;
  private badgeUrl: string;

  public constructor(
    private modalService: NgbModal,
    @Inject('Window') private window: Window) {

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


  }

  private typeSelected(item: DropdownItem) {
    this.selectedType = this.types[item.id - 1];
  }

  public open() {
    this.modalService.open(this.content).result;
    new Clipboard(document.querySelector('#copy-button'), {
      text: () => {
        return this.selectedType.url;
      }
    });
  }
}
