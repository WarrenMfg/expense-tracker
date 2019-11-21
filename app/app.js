/*

 ### Basic Reqs
- [ ] Where to store data? (localstorage)
- [ ] How to capture data? (web form)
- [ ] How to modify data? (update action, delete action)
- [ ] How to view data? (style?)
- [ ] UI/UX considerations (how are we going to use this)

*/

// Local Storage Utility Functions
//get item
var getItem = function(key) {
  return window.localStorage.getItem(key);
};

//create
var createItem = function(key, value) {
  window.localStorage.setItem(key, value);
};

//update
var updateItem = function(key, value) {
  window.localStorage.setItem(key, value);
};

//delete
var deleteItem = function(key) {
  window.localStorage.removeItem(key);
};

//clear everything
var clearEverything = function() {
  window.localStorage.clear();
};

// key exists?
var keyExists = function(key) {
  var currentValue = getItem(key);
  return currentValue !== null;
};


///////////////////////////////////////////
$(document).ready(function() {
  // click event listener for create
  $('#createButton').click(function(event) {
    event.preventDefault(); // prevent refresh!
    var currentKey = $('#keyInput').val();
    var currentValue = $('#valueInput').val();
    if(keyExists(currentKey)) {
      // oopsie, maybe let the user know
    } else {
      createItem(currentKey, currentValue);
    }
  });

  // click event listener for update
  $('#updateButton').click(function(event) {
    event.preventDefault(); // prevent refresh!
    var currentKey = $('#keyInput').val();
    var currentValue = $('#valueInput').val();
    if(keyExists(currentKey)) {
      updateItem(currentKey, currentValue);
    } else {
      // oopsie, maybe let the user know
    }
  });
});
