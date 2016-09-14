import { Component, Input } from '@angular/core';

@Component({
  selector: 'status-indicator',
  templateUrl: 'status-indicator.component.html'
})
export class StatusIndicatorComponent {
  @Input() private gistValid: boolean;
  @Input() private webhookValid: boolean;
}
