import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../shared/github/user';

@Component({
  selector: 'app-frame',
  templateUrl: './app-frame.component.html'
})
export class AppFrameComponent {
    @Input() public user: User = null;
    @Output() public logout: EventEmitter<void> = new EventEmitter<void>();
}
