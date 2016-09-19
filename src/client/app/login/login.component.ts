import { Component, Input, OnInit, trigger, state, style, transition, animate } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
declare const AdobeEdge: any;

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  animations: [
    trigger('slideState', [
      state('inactive', style({
        opacity: 0,
        marginLeft: '-100%'
      })),
      state('active', style({
        opacity: 1,
        marginLeft: '0px'
      })),
      transition('inactive => active', [
        style({
          opacity: 0,
          marginLeft: '100%'
        }),
        animate('500ms linear')
      ]),
      transition('active => inactive', animate('500ms linear'))
    ])
  ]

})
export class LoginComponent implements OnInit {
  public active: number;

  // text slider
  public numberRepos: number = 0;
  public numberClas: number = 0;
  public numberStars: number = 0;


  constructor(
    private authService: AuthService,
    private router: Router,
    private http: Http) {

    this.active = 0;
    this._updateNumberOfRepos();
    this._updateNumberOfCLAs();
    this._updateNumberOfStars();
    this._TriggerSlider();
  }

  public ngOnInit() {
    AdobeEdge.loadComposition('assets/js/CLA_signature_MouseOver', 'EDGE-110781156', {
      scaleToFit: "none",
      centerStage: "none",
      minW: "0",
      maxW: "undefined",
      width: "550px",
      height: "400px"
    }, {
        dom: []
      }, {
        dom: []
      });
  }

  public logAdminIn() {
    this.authService.doLogin(true, false);
  }

  private _updateNumberOfRepos() {
    this.http.get('/count/repos').subscribe(
      (res) => this.numberRepos = res.json().count
    );
  }

  private _updateNumberOfCLAs() {
    this.http.get('/count/clas').subscribe(
      (res) => this.numberClas = res.json().count
    );
  }

  private _updateNumberOfStars() {
    this.http.get('/count/stars').subscribe(
      (res) => this.numberStars = res.json().count
    );
  }

  private _TriggerSlider() {
    setInterval(
      () => {
        this.active = this.active + 1 === 3 ? 0 : this.active + 1;
      },
      5000);
  }
}
