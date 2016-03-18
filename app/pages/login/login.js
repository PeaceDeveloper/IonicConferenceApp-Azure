import {IonicApp, Page, NavController} from 'ionic-angular';
import {Inject} from 'angular2/core';
import {TabsPage} from '../tabs/tabs';
import {SignupPage} from '../signup/signup';
import {SchedulePage} from '../schedule/schedule';
import {UserData} from '../../providers/user-data';
import {Component, View, NgZone} from 'angular2/core';


@Page({
  templateUrl: 'build/pages/login/login.html'
})
export class LoginPage {
  static get parameters() {
    return [[NavController], [UserData]];
  }

  constructor(nav, userData) {
    this.nav = nav;
    this.userData = userData;
    this.token;
    this.authenticated = false;
    console.log('///', userData);

    this.login = {};
    this.submitted = false;
    this.client = new WindowsAzure.MobileServiceClient('https://testingwithazure.azurewebsites.net/');

      this.myZoneSpec = {
  beforeTask: function () {
    console.log('Before task');
      this.userData.login();
  this.nav.push(TabsPage); 
  }.bind(this),
  afterTask: function () {
    console.log('After task');
      this.userData.login();
  this.nav.push(TabsPage); 
  }.bind(this)
};

  }

  doLogin(socialNetwork) {
      //this.nav.push(TabsPage); 
    this.client.login(socialNetwork).done(this.loginResponse.bind(this));
  }

  loginResponse(response) {
    console.log('auth response', response);
        // BEGINNING OF ORIGINAL CODE
  this.token = response.userId;
  this.userData.loginToken = this.token;
  this.todoItemTable = this.client.getTable('todoitem'); 
  this.userData.todoItemTable = this.todoItemTable;
  console.log('here is the token', this.userData.loginToken, this.userData);

  // this.userData.login();
  // this.nav.push(SchedulePage); 
  

this.myZone = zone.fork(this.myZoneSpec);
this.myZone.run().bind(this);
 

  }




  gotoSchedule() {
  this.userData.login();
  this.nav.push(TabsPage); 

  }


  // onLogin(form) {
  //   this.submitted = true;

  //   if (form.valid) {
  //     this.userData.login();
  //     this.nav.push(TabsPage);
  //   }
  // }

  // onSignup() {
  //   this.nav.push(SignupPage);
  // }
}
