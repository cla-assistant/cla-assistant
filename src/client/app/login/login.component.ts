import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  @Input() public active: number;

  // text slider
  public numberRepos: number;
  public numberClas: number;
  public numberStars: number;
  public time = '5000';


  constructor(
    private authService: AuthService,
    private router: Router) {

    this.active = 0;
    this._updateNumberOfRepos();
    this._updateNumberOfCLAs();
    this._updateNumberOfStars();
    this._TriggerSlider();
  }

  public logAdminIn() {
    this.authService.doLogin(true, false);
  }

  private _updateNumberOfRepos() {
    this.numberRepos = 10;
  }

  private _updateNumberOfCLAs() {
    this.numberClas = 1;
  }

  private _updateNumberOfStars() {
    this.numberStars = 5;
  }

  private _TriggerSlider() {
    setTimeout(
      (time) => {
        this.active = +this.active + 1 === 3 ? 0 : +this.active + 1;
        this._TriggerSlider();
      },
      this.time);
  }
}
