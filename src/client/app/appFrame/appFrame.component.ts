import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../shared/github/user';

@Component({
  selector: 'app-frame',
  templateUrl: './appFrame.html'
})
export class AppFrame {
    @Input() public user: User = null;
    @Output() public logout: EventEmitter<void> = new EventEmitter<void>();
}
