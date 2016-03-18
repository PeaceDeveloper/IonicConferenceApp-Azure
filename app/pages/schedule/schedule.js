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
    this.items=[];
    this.token;
    this.todoItemTable;

    this.dayIndex = 0;
    this.queryText = '';
    this.excludeTracks = [];
    this.filterTracks = [];
    this.segment = 'all';

    this.hasSessions = false;
    this.groups = [];
    this.headers = {
      'X-ZUMO-AUTH': this.user.loginToken
      };

      this.init = {
          headers: new Headers(this.headers)
      };
    this.todoItemTable = this.user.todoItemTable;
    this.refreshDisplay();
    this.updateSchedule();
  }

  refreshDisplay() {
      this.todoItemTable
      .read()
      .then(this.createTodoItemList.bind(this), this.handleError);  
  }

    createTodoItemList(itemList) {

      itemList.forEach(function(item) {
        if(item.userid === this.user.loginToken){
        this.items.push(item);
        this.user.addFavorite(item.text);
        }
      }, this);     
      console.log('i am executing', this.items);
      this.updateFavourites();  
    }

    handleError(error) {
        var text = error + (error.request ? ' - ' + error.request.status : '');
        console.error(text);
        $('#errorlog').append($('<li>').text(text));
    }


  onPageDidEnter() {
    this.app.setTitle('Schedule');
  }

  updateFavourites() {
      this.groups.forEach(function(sessions) {
        var sessions = sessions.sessions
        sessions.forEach(function(session) {
          if(this.user.hasFavorite(session.name)){
            session.favorited = true;
        } else {
          session.favorited = false;
          this.user.removeFavorite(session.name);
        }
      }, this);
    }, this);  
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

  removeFavorite(slidingItem, sessionData) {
   // woops, they already favorited it! What shall we do!?
   // create an alert instance
   let alert = Alert.create({
     title: 'Remove Favorite',
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
          },this.init).then(function(data){
             console.log('favorite removed');
           }, function error(error){
             console.error('here is the error', error);
           }); 
           }
         }, this);


           // close the sliding item and hide the option buttons
           slidingItem.close();
           this.updateFavourites(); 
         }
       }
     ]
   });
   // now present the alert on top of all other content
   this.nav.present(alert); 

  }

  addFavorite(slidingItem, sessionData) {
   
      this.user.addFavorite(sessionData.name);
    
      console.log('sup', sessionData);
      console.log('userdata', this.user.loginToken);
        this.todoItemTable.insert({
          text: sessionData.name,
          complete: false,
          userid: this.user.loginToken
        }, this.init).then(function(data){
          console.log('lets bind');
          this.items.push(data);
          console.log('promisereturn', data, typeof(this.items), this.items);
          console.log('lets bind2');

        }.bind(this), function error(error){
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
            this.updateFavourites(); 
          }
        }]
      });
      // now present the alert on top of all other content
      this.nav.present(alert);
  }

}
