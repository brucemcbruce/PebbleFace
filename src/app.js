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

var active_tasks = [];

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

var shift_card = new UI.Card({
  title: 'Shift Details',
  body: 'Next Break: 3:30pm (15 minutes)\n Shift Ends: 7:00pm\n Next Shift: 14/02/2015 - 3:30pm-6:00pm'
});

var notify_list = new UI.Menu({
  sections: [{
    title: 'General Notifications',
    items: [{
      title: 'Notify Manager',
      subtitle: 'John Smith'
    }, {
      title: 'Notify Prodice',
      subtitle: 'Joe Brown'
    }, {
      title: 'Notify Longlife',
      subtitle: 'Matt Cole'
    }]
  }, {
    title: 'Emergency',
    items: [{
      title: 'Alert Manager',
      subtitle: 'John Smith'
    }, {
      title: 'Alert Security',
      subtitle: 'Sam Smith'
    }, {
      title: 'Alert Police',
      subtitle: '000'
    }]
  }]
});

main.show();

main.on('select', function(e) {
  var selection = e.item.title;
  if(selection == 'Active Tasks') {
    tasks_list.show();
  } else if(selection == 'Notify') {
    notify_list.show();
  } else if(selection == 'Shift') {
    shift_card.show();
  }
});


setInterval(function(){
  updateTasks();
  updateNotifications();
}, 5000);

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
    Vibe.vibrate('double');
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

notify_card.on('click', 'select', function() {
  acceptNotification(notify_card);
  notify_card.hide();
});

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
        var notif_latest = JSON.parse(data[data.length-1]);
        notify_card.id = notif_latest.id;
        notify_card.title(notif_latest.type);
        notify_card.body(notif_latest.location);
        notify_card.show();
      }
    },
    function(error) {
      // Failure!
      console.log('Failed fetching '+ notifURL +' data: ' + error);
    }
  );
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