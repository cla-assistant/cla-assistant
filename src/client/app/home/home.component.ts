import { Component } from '@angular/core';
import { AuthService } from '../login/auth.service';
@Component({
  selector: 'home',
  template: `
  <h1>HOME</h1>
  <button (click)="onLogout()">Logout</button>
  `
})
export class Home {
  constructor(private authService: AuthService) { }

  public onLogout() {
    this.authService.doLogout();
  }
}
