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

  // ONLOAD: READ LOCALSTORAGE AND UPDATE HTML // localStorageKeys.sort((a, b) => a - b);
  function order(order) {
    let localStorage = window.localStorage;
    let localStorageKeys = Object.keys(localStorage);
    let parsedLocalStorage = {};

    // parse localStorage
    localStorageKeys.forEach(key => {
      parsedLocalStorage[key] = JSON.parse(localStorage[key]);
    });




    addToHTML(key, parsedLocalStorage[key]['category'], parsedLocalStorage[key]['subcategory'], parsedLocalStorage[key]['dateKey'], parsedLocalStorage[key]['expense']);
  }
  // order('newest'); // default


  // UPDATE CATEGORIES


  // UPDATE SUBCATEGORIES



  // CREATE AND UPDATE
  // $('#amount').keyup(function(event) {
  //   why is enter working???
  // });
  $('#addExpense').click(function(event) {
    event.preventDefault(); // prevent refresh!

    let timestamp = new Date().getTime();
    let category = $('#category')[0].value; // localStorage key
    let subcategory = $('#subcategory')[0].value; // key in local value object
    let dateKey = $('#date')[0].value;
    let expense = parseFloat($('#amount').val()).toFixed(2); // (string)
    let expenseObj;

    // if something is missing
    if (!category || !subcategory || !dateKey || !parseFloat(expense)) {
      // notify user somthing is missing
      return;
    } else {
      // create
      createDataStructure(timestamp, category, subcategory, dateKey, expense);
    }
  });


  function createDataStructure(timestamp, category, subcategory, dateKey, expense) {
    dateKey = dateKey.split('-');
    let parsedLocalStorage;
    let newExpenseObj = {};
    newExpenseObj['timestamp'] = timestamp;
    newExpenseObj['category'] = category;
    newExpenseObj['subcategory'] = subcategory;
    newExpenseObj['dateKey'] = dateKey;
    newExpenseObj['expense'] = expense;

    if (keyExists(dateKey[0])) { // if year exists
      parsedLocalStorage = JSON.parse(getItem(dateKey[0]));

      if (parsedLocalStorage[dateKey[1]]) { // if month exists
        if (parsedLocalStorage[dateKey[1]][dateKey[2]]) { // if day exists
          console.log('day exists');
          parsedLocalStorage[dateKey[1]][dateKey[2]].push(newExpenseObj);
        } else { // if day does not exist
          console.log('day does not exist');
          parsedLocalStorage[dateKey[1]][dateKey[2]] = [newExpenseObj];
        }
      } else { // if month does not exist
        console.log('month does not exist');
        let monthObj = {};
        monthObj[dateKey[2]] = [newExpenseObj];
        parsedLocalStorage[dateKey[1]] = monthObj;
      }

      updateItem(dateKey[0], JSON.stringify(parsedLocalStorage));
    } else { // if year does not exist
      let yearObj = {};
      let monthObj = {};
      monthObj[dateKey[2]] = [newExpenseObj];
      yearObj[dateKey[1]] = monthObj;
      createItem(dateKey[0], JSON.stringify(yearObj));
    }

    addToHTML(timestamp, category, subcategory, dateKey, expense);
  }


  function addToHTML(timestamp, category, subcategory, dateKey, expense) {
    // format date
    let year = dateKey[0];
    let month = dateKey[1];
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
    let day = parseInt(dateKey[2]).toString();
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
    let orderAndReset = $('#order-and-reset');
    orderAndReset.after(`
    <div class="expenseItem">
      <div>
        <p>${dateFormat}</p>
        <div class="cat-and-subcat"><span>${category}</span> <span>${subcategory}</span></div>
        <p>$${expense}</p>
      </div>

      <button class="delete" data-timestamp="${timestamp}" data-datekey="${dateKey}">Delete</button>
    </div>`);

    $('#amount').val('').focus();
  }


  // DELETE
  $('#expenses').on('click', '.delete', function(event) {
    let timestamp = this.dataset.timestamp;
    let dateKey = this.dataset.datekey;
    let parsedLocalStorage = JSON.parse(getItem(dateKey[0]));
    let expenseArray = parsedLocalStorage[dateKey[1]][dateKey[2]];

    expenseArray.forEach((obj, index, arr) => {
      if (obj['timestamp'] === timestamp) {
        arr[index].splice(index, 1);
      }
    });

    $(this).parent().remove();
  });
});
