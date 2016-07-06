import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'login',
  templateUrl: './login.html'
})
export class Login {
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
    this._TiggerSlider();
  }

  public logAdminIn() {
    // this._window.location.href = '/auth/github?admin=true';
    this.authService.doLogin('admin');
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

  private _TiggerSlider() {
    setTimeout(
      (time) => {
        this.active = +this.active + 1 === 3 ? 0 : +this.active + 1;
        this._TiggerSlider();
      },
      this.time);
  }
}
