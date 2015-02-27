/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vibe = require('ui/vibe');
var ajax = require('ajax');

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
  active_tasks.forEach(function(entry) {
    if (entry.id === target_id) {
      return true;
    }
  });
  return false;
}

function updateTasks() {
  // Construct URL
  var URL = 'http://32aab500.ngrok.com';
  var taskURL = URL + '/tasks.json';
  
  // Make the request
  ajax(
    {
      url: taskURL,
      type: 'json'
    },
    function(data) {
      // Success!
      console.log('Successfully fetched data!');
      var section = [];
      console.log(data);
    
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