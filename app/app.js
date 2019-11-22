// Local Storage Utility Functions
//get item
let getItem = function(key) {
  return window.localStorage.getItem(key);
};

//create
let createItem = function(key, value) {
  window.localStorage.setItem(key, value);
};

//update
let updateItem = function(key, value) {
  window.localStorage.setItem(key, value);
};

//delete
let deleteItem = function(key) {
  window.localStorage.removeItem(key);
};

//clear everything
let clearEverything = function() {
  window.localStorage.clear();
};

// key exists?
let keyExists = function(key) {
  let currentValue = getItem(key);
  return currentValue !== null; // true that it does NOT equal null
};






$(document).ready(function() {

  // ONLOAD: READ LOCALSTORAGE AND UPDATE HTML (Need timestamp of when it was entered???)

  // UPDATE CATEGORIES

  // UPDATE SUBCATEGORIES



  // CREATE AND UPDATE
  // $('#amount').keyup(function(event) {
  //   why is enter working???
  // });
  $('#addExpense').click(function(event) {
    event.preventDefault(); // prevent refresh!

    let category = $('#category')[0].value; // localStorage key
    let subcategory = $('#subcategory')[0].value; // key in local value object
    let dateKey = $('#date')[0].value;
    let expense = parseFloat($('#amount').val()).toFixed(2); // value in array at subcategory key (of string type)
    let storageObj = {};

    // if something is missing
    if (!category || !subcategory || !dateKey || !parseFloat(expense)) {
      // notify user somthing is missing
      return;
    }

    // added to localStorage
    if (keyExists(category)) { // if category exists
      let parsedCategory = JSON.parse(getItem(category)); // parse object
      if (parsedCategory[subcategory]) { // if subcategory exists
        if (parsedCategory[subcategory][dateKey]) { // if date exists
          parsedCategory[subcategory][dateKey].push(expense) - 1;
        } else { // if no date
          parsedCategory[subcategory][dateKey] = [expense];
        }
      } else { // if no subcategory
        parsedCategory[subcategory] = {};
        parsedCategory[subcategory][dateKey] = [expense];
      }

      updateItem(category, JSON.stringify(parsedCategory)); // add to localStorage

    } else { // if no category
      if (category !== '') {
        storageObj[subcategory] = {};
        storageObj[subcategory][dateKey] = [expense];
        createItem(category, JSON.stringify(storageObj));
      }
    }

    // add to html
    addToHTML(category, subcategory, dateKey, expense); // all strings
    $('#amount').val('').focus();
  });

  function addToHTML(category, subcategory, dateKey, expense) {
    // format date
    let dateArray = dateKey.split('-');
    let year = dateArray[0];
    let month = dateArray[1];
    let monthObj = {
      '01': 'January',
      '02': 'February',
      '03': 'March',
      '04': 'April',
      '05': 'May',
      '06': 'June',
      '07': 'July',
      '08': 'August',
      '09': 'September',
      '10': 'October',
      '11': 'November',
      '12': 'December'
    };
    let day = parseInt(dateArray[2]).toString();
    let newDate = new Date(`${monthObj[month]} ${day} ${year}`);
    newDate = newDate.toDateString()
    newDate = newDate.split(' ');
    let dayOfWeek = newDate[0];
    let dayOfWeekObj = {
      'Sun': 'Sunday',
      'Mon': 'Monday',
      'Tue': 'Tuesday',
      'Wed': 'Wednesday',
      'Thu': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday'
    };
    let dateFormat = `${dayOfWeekObj[dayOfWeek]}, ${monthObj[month]} ${day}, ${year}`;

    // prepend to list of expenses
    let expenses = $('#expenses');
    expenses.prepend(`
    <div class="expenseItem">
      <div>
        <p>${dateFormat}</p>
        <div class="cat-and-subcat"><span>${category}</span> <span>${subcategory}</span></div>
        <p>$${expense}</p>
      </div>

      <button class="delete" data-datekey="${dateKey}" data-category="${category}" data-subcategory="${subcategory}" data-expense="${expense}">Delete</button>
    </div>`);
  }

  // DELETE
  $('#expenses').on('click', '.delete', function(event) {
    let dataset = this.dataset;
    let category = dataset.category;
    let subcategory = dataset.subcategory;
    let dateKey = dataset.datekey;
    let parsedCategory = JSON.parse(window.localStorage.getItem(category));
    let expenseIndex = parsedCategory[subcategory][dateKey].indexOf(dataset.expense);

    // remove expense
    parsedCategory[subcategory][dateKey].splice(expenseIndex, 1);

    // if array is empty remove date
    if (parsedCategory[subcategory][dateKey].length === 0) {
      delete parsedCategory[subcategory][dateKey];
    }
    // if no more dates in subcategory, remove subcategory
    if (Object.keys(parsedCategory[subcategory]).length === 0) {
      delete parsedCategory[subcategory]
    }
    // if no more subcategories, remove localStorage key/value
    if (Object.keys(parsedCategory).length === 0) {
      deleteItem(category);
    } else {
      updateItem(category, JSON.stringify(parsedCategory));
    }

    $(this).parent().remove();
  });
});
