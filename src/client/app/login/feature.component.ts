import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'feature',
  templateUrl: 'feature.component.html'
})
export class FeatureComponent {
  @Input()
  private text: string;
  @Input()
  private header: string;
  @Input()
  private iconSrc: string;

  private showText: boolean = false;
}
