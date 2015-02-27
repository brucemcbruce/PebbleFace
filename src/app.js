/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vibe = require('ui/vibe');
var ajax = require('ajax');

// API URL
var apiURL = 'http://32aab500.ngrok.com';
var taskURL = apiURL + '/tasks.json';
var notifURL = apiURL + '/notifications.json';
var acceptNotifURL = apiURL + '/accept_notification';
var raiseAlertURL = apiURL + '/notifications';

var pollApiMillisecs = 2000;

var active_tasks = [];

var team_member_list = ['Dave Warner', 'Aaron Finch', 'Shane Watson', 'Steve Smith', 'Michael Clarke'];
var role_list = ['Bakery', 'Deli', 'Produce', 'Service'];

var DEFAULT_INITIAL_ROLE = role_list[0];
var currentUser = '';
var currentRole = DEFAULT_INITIAL_ROLE;

var loginScreenShowDurationMillisecs = 1000;
var logoutScreenShowDurationMillisecs = 1000;
var breakScreenShowDurationMillisecs = 1000;

var main = new UI.Menu({
  sections: [{
    items: [{
      title: 'Active Tasks',
      subtitle: active_tasks.length + ' active tasks'
    }, {
      title: 'Notify',
      subtitle: 'Ask for help'
    }, {
      title: 'Shift',
      subtitle: 'Break and roster details'
    }]
  }]
});

var tasks_list = new UI.Menu({
  sections: [{
    items: active_tasks
  }]
});

var notify_list = new UI.Menu({
  sections: [{
    items: [
      { 
        title: 'Spill',
      }, {
        title: 'Trolleys', 
      }, {
        title: 'Help Needed', 
      }, {
        title: 'Customer Query', 
      }, {
        title: 'Security Check', 
      }, {
        title: 'Truck Arrival', 
      }, {
        title: 'Fill Gap'
      }
    ]
  }]
});

var location_list = new UI.Menu({
  sections: [{
    items: [
      { 
        title: 'Bakery',
      }, {
        title: 'Deli', 
      }, {
        title: 'Produce', 
      }, {
        title: 'Aisle 1', 
      }, {
        title: 'Aisle 2', 
      }, {
        title: 'Aisle 3', 
      }, {
        title: 'Aisle 4'
      }
    ]
  }]
});

/*
var shift_card = new UI.Card({
  title: 'Shift Details',
  body: 'Next Break: 3:30pm (15 minutes)\n Shift Ends: 7:00pm\n Next Shift: 14/02/2015 - 3:30pm-6:00pm'
});
*/

main.show();

main.on('select', function(e) {
  var selection = e.item.title;
  if(selection == 'Active Tasks') {
    tasks_list.show();
  } else if(selection == 'Notify') {
    notify_list.show();
  } else if(selection == 'Shift') {
    if (userIsSignedOn()) {
      shift_list.show();
    } else {
      shift_select_user_to_signin_list.show();
    }
  }
});

notify_list.on('select', function(e) {
  location_list.alert_type = e.item.title;
  location_list.show();
});

setInterval(function(){
  updateTasks();
  updateNotifications();
}, pollApiMillisecs);

function alertOnNewTasksAndClearOldTasks(fetched_tasks) {
  var new_active_tasks = [];
  var new_tasks = false;
  fetched_tasks.forEach(function(entry) {
    if (!new_tasks && !activeTasksContains(entry.id)) {
      new_tasks = true;
    }
    new_active_tasks.push(entry);
  });
  if (new_tasks) {
    Vibe.vibrate('short');
  }
  return new_active_tasks;
}

function activeTasksContains(target_id) {
  for (var i = 0; i < active_tasks.length; i++) {
    var entry = active_tasks[i];
    if (entry.id === target_id) {
      return true;
    }
  }
  return false;
}

var notify_card = new UI.Card({
  title: "No notifications yet."
});

var already_ack_card = new UI.Card({
  title: "Error.",
  body: "Someone else has already actioned notification."
});
already_ack_card.on('click', 'select', function() {
  already_ack_card.hide();
});

notify_card.on('click', 'back', function() {
  denyNotification(notify_card);
  notify_card.hide();
});

notify_card.on('click', 'select', function() {
  acceptNotification(notify_card);
  notify_card.hide();
});


var dismissed_alerts = [];

function updateNotifications() {
  // Make the request
  ajax(
    {
      url: notifURL,
      type: 'json'
    },
    function(data) {
      // Success!
      console.log('Successfully fetched data: '+data);
      
      if (data.length > 0) {
        var notif_latest = getNextNotification(data, 1);
        if(notif_latest !== false) {
          notify_card.id = notif_latest.id;
          notify_card.title('Alert: ' + notif_latest.type);
          notify_card.body('In ' + notif_latest.location + '. Please press middle button to accept or back to cancel.');
          notify_card.show();
          Vibe.vibrate('double');
        }
      }
    },
    function(error) {
      // Failure!
      console.log('Failed fetching '+ notifURL +' data: ' + error);
    }
  );
}

function getNextNotification(data, index) {
  var notif = JSON.parse(data[data.length-index]);
  if(dismissed_alerts.indexOf(notif.id) != -1) {
    //Show the alert
    return notif;
  } else {
    //Dont show the alert;
    if(data.lenth >= index + 1) {
      getNextNotification(data, index + 1);
    } else {
      return false;
    }
  }
}

function denyNotification(notify_card) {
  console.log('denied card '+notify_card.id);
  dismissed_alerts.push(notify_card.id);
}

function acceptNotification(notify_card) {
  console.log('accepted card '+notify_card.id);
  // Make the request
  var acceptCurrentNotifURL = acceptNotifURL + '?notification_id=' + notify_card.id + '&user_id=' + 1;
  ajax(
    {
      url: acceptCurrentNotifURL ,
      type: 'json'
    },
    function(data) {
      // Success!
      console.log('Successfully ack notif id: '+notify_card.id);
      var success = data.success;
      if(success == 'false'){
        already_ack_card.show();
      }
    },
    function(error) {
      // Failure!
      console.log('Failed ack '+ acceptCurrentNotifURL +' id: ' + notify_card.id);
    }
  );
}

function updateTasks() {
  // Make the request
  ajax(
    {
      url: taskURL,
      type: 'json'
    },
    function(data) {
      // Success!
      console.log('Successfully fetched data: '+data);
      var section = [];
    
      for(var i=0; i<data.length; i++){
        var element = JSON.parse(data[i]);
        var item = {id:element.id, title: element.name, subtitle: element.body};
        section.push(item);
      }
      active_tasks = alertOnNewTasksAndClearOldTasks(section);
      main.item(0,0,{title:"Active Tasks", subtitle:active_tasks.length + ' active tasks'});
      tasks_list.items(0, active_tasks);
    },
    function(error) {
      // Failure!
      console.log('Failed fetching '+ taskURL +' data: ' + error);
    }
  );
}

location_list.on('select', function(e) {
  var notification_location = e.item.title;
  var notification_type = location_list.alert_type;
  console.log("Raising "+notification_type+" at "+notification_location);
  ajax(
    {
      url: raiseAlertURL + '?notification_location=' + encodeURIComponent(notification_location) + '&notification_type=' + encodeURIComponent(notification_type),
      type: 'json',
      method: 'post',
    },
    function(data) {
      // Success!
      console.log('Successfully raised notification, data: '+data);
    },
    function(error) {
      // Failure!
      console.log('Failed creating '+notification_type+' notification, data: ' + error);
    }
  );
  main.show();
});

// Shift menu handling
var shift_list = new UI.Menu({
  sections: [{
    title: 'Shift Details',
    items: [{
      title: 'Break'
    }, {
      title: 'Change Role'
    }, {
      title: 'Sign Off'
    }]
  }]
});

var shift_select_user_to_signin_list = new UI.Menu({
  sections: [{ title: 'Select team member', items: [{ }]}]
});

// Initialise Users list menu - shift_select_user_to_signin_list
for (var i = 0; i < team_member_list.length; i++) {
  var member = team_member_list[i];
  shift_select_user_to_signin_list.item(0, i, {title: member});
}

var shift_change_role_list = new UI.Menu({
  sections: [{ title: 'Select role', items: [{ }]}]
});

// Initialise role list menu - shift_change_role_list
for (var i = 0; i < role_list.length; i++) {
  var role = role_list[i];
  shift_change_role_list.item(0, i, {title: role});
}

var isSignedOn = false;
function userIsSignedOn() {
  // Not doing anything complex right now...
  return isSignedOn;
}
function signOn(user) {
  isSignedOn = true;
  currentUser = user;
  currentRole = DEFAULT_INITIAL_ROLE;
}
function signOff() {
  isSignedOn = false;
  currentUser = '';
}

var user_logged_in_card = new UI.Card ({
  title: 'Logged in'
});
var user_logged_out_card = new UI.Card ({
  title: 'Logged out'
});

shift_select_user_to_signin_list.on('select', function(e) {
  var userToLogIn = e.item.title;
  console.log('Log in : ' + userToLogIn + '.');
  signOn(userToLogIn);
  user_logged_in_card.title('Logged in ' + userToLogIn);
  user_logged_in_card.show();
  setTimeout(function() {
    shift_list.show();
    user_logged_in_card.hide();
    // Hide this screen also
    shift_select_user_to_signin_list.hide();
  }, loginScreenShowDurationMillisecs);
});

shift_list.on('select', function(e) {
  var selection = e.item.title;
  if (selection == 'Sign Off') {
    user_logged_out_card.title('Logged out ' + currentUser);
    signOff();
    user_logged_out_card.show();
    setTimeout(function() {
      user_logged_out_card.hide();
      // Hide this screen also
      shift_list.hide();
    }, logoutScreenShowDurationMillisecs);
  } else if (selection == 'Break') {
    shift_break_list.show();
    setTimeout(function() {
      shift_break_list.hide();
    }, breakScreenShowDurationMillisecs);
  } else if (selection == 'Change Role') {
    updateRoleListToShowCurrentRole();
    shift_change_role_list.show();
  }
});

var shift_break_list = new UI.Card ({
  title: 'Remember',
  subtitle: 'Enjoy your break!'
});

/*
var shift_change_role_list = new UI.Menu ({
  sections: [{
    title: 'Select Role',
    items: [{
      title: 'Bakery'
    }, {
      title: 'Deli'
    }, {
      title: 'Produce'
    }, {
      title: 'Service'
    }]
  }]
});
*/
shift_change_role_list.on('select', function(e) {
  currentRole = e.item.title;
  shift_change_role_list.hide();
  updateRoleListToShowCurrentRole();
});

function updateRoleListToShowCurrentRole() {
  for (var i = 0; i < shift_change_role_list.items(0).length; i++) {
    if (shift_change_role_list.item(0, i).title === currentRole) {
      shift_change_role_list.item(0, i, {subtitle: 'current role'});
    } else {
      shift_change_role_list.item(0, i, {subtitle: ''});
    }
  } 
}

