import { Component, Input } from '@angular/core';
import {POPOVER_DIRECTIVES} from 'ng2-popover';

@Component({
  selector: 'status-indicator',
  directives: [POPOVER_DIRECTIVES],
  templateUrl: 'status-indicator.component.html'
})
export class StatusIndicatorComponent {
  @Input() private gistValid: boolean;
  @Input() private webhookValid: boolean;
}
