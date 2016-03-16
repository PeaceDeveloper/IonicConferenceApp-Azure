import {IonicApp, Page, Modal, Alert, NavController} from 'ionic-angular';
import {Inject} from 'angular2/core';
import {ConferenceData} from '../../providers/conference-data';
import {UserData} from '../../providers/user-data';
import {ScheduleFilterPage} from '../schedule-filter/schedule-filter';
import {SessionDetailPage} from '../session-detail/session-detail';


@Page({
  templateUrl: 'build/pages/schedule/schedule.html'
})
export class SchedulePage {
  static get parameters() {
    return [[IonicApp], [NavController], [ConferenceData], [UserData]];
  }

  constructor(app, nav, confData, user) {
    this.app = app;
    this.nav = nav;
    this.confData = confData;
    this.user = user;
    this.items;
    this.token;
    this.todoItemTable;

    this.dayIndex = 0;
    this.queryText = '';
    this.excludeTracks = [];
    this.filterTracks = [];
    this.segment = 'all';

    this.hasSessions = false;
    this.groups = [];

    this.client = new WindowsAzure.MobileServiceClient('https://testingwithazure.azurewebsites.net/');
    this.updateSchedule();
    (this.refreshLogin.bind(this))();
  }

  refreshLogin() {
    this.client.login('twitter').then(this.loginResponse.bind(this));
  };

  loginResponse(response) {
        // BEGINNING OF ORIGINAL CODE
        this.token = response.mobileServiceAuthenticationToken;
        // Create a table reference
         this.todoItemTable = this.client.getTable('todoitem');   
         this.refreshDisplay();
  }

  refreshDisplay() {
      this.todoItemTable
      .read()
      .then(this.createTodoItemList.bind(this), this.handleError);  
  }

    createTodoItemList(itemList) {
      this.items = itemList;

      itemList.forEach(function(item) {
        this.user.addFavorite(item.text);
      }, this);       
    }

    handleError(error) {
        var text = error + (error.request ? ' - ' + error.request.status : '');
        console.error(text);
        $('#errorlog').append($('<li>').text(text));
    }


  onPageDidEnter() {
    this.app.setTitle('Schedule');
  }

  updateSchedule() {
    this.confData.getTimeline(this.dayIndex, this.queryText, this.excludeTracks, this.segment).then(data => {
      this.shownSessions = data.shownSessions;
      this.groups = data.groups;
    });
  }

  presentFilter() {
    let modal = Modal.create(ScheduleFilterPage, this.excludeTracks);
    this.nav.present(modal);

    modal.onDismiss(data => {
      if (data) {
        this.excludeTracks = data;
        this.updateSchedule();
      }
    });

  }

  goToSessionDetail(sessionData) {
    // go to the session detail page
    // and pass in the session data
    this.nav.push(SessionDetailPage, sessionData);
  }

  addFavorite(slidingItem, sessionData) {
    console.log(sessionData, slidingItem);


    if (this.user.hasFavorite(sessionData.name)) {
      // woops, they already favorited it! What shall we do!?
      // create an alert instance
      let alert = Alert.create({
        title: 'Favorite already added',
        message: 'Would you like to remove this session from your favorites?',
        buttons: [
          {
            text: 'Cancel',
            handler: () => {
              // they clicked the cancel button, do not remove the session
              // close the sliding item and hide the option buttons
              slidingItem.close();
            }
          },
          {
            text: 'Remove',
            handler: () => {
              // they want to remove this session from their favorites
              this.user.removeFavorite(sessionData.name);
              this.items.forEach(function(item) {
              if(!item.deleted && item.text == sessionData.name) {
              console.log('trying to delete', item.id);  
              this.todoItemTable.del({
                id: item.id
             }).then(function(data){
                console.log('promisereturn', data)
              }, function error(error){
                console.error('here is the error', error);
              }); 
                
              }
            }, this);
              // close the sliding item and hide the option buttons
              slidingItem.close();
            }
          }
        ]
      });
      // now present the alert on top of all other content
      this.nav.present(alert);

    } else {
      // remember this session as a user favorite
      this.user.addFavorite(sessionData.name);
    
      console.log('sup', sessionData);

        this.todoItemTable.insert({
          text: sessionData.name,
          complete: false,
          userid: this.token
        }).then(function(data){
          console.log('promisereturn', data)
        }, function error(error){
          console.error('here is the error', error);
        });

      // create an alert instance
      let alert = Alert.create({
        title: 'Favorite Added',
        buttons: [{
          text: 'OK',
          handler: () => {
            // close the sliding item
            slidingItem.close();
          }
        }]
      });
      // now present the alert on top of all other content
      this.nav.present(alert);
    }

  }

}
