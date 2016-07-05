import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-frame',
  templateUrl: 'app/appFrame/appFrame.html'
})
export class AppFrame {
    @Input() public user: User = null;
    @Output() public logout: EventEmitter<void> = new EventEmitter<void>();
}
