/*
TODO
- add jQuery effects when adding expense
- add c3js graph
- ability to add category and subcategory
- add indication of current expense order
*/

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

  // LOAD userPrefs INTO LOCALSTORAGE
  let userPrefs = []; // 0: order, 1: obj with category keys with subcat values arr
  if (!keyExists('userPrefs')) {
    userPrefs.push('newest');
    createItem('userPrefs', JSON.stringify(userPrefs));
  }

  function userOrder(order) {
    let storedUserPrefs = JSON.parse(getItem('userPrefs'));
    if (arguments.length === 0) { // getter
      return storedUserPrefs[0];
    } else { // setter
      storedUserPrefs[0] = order;
      updateItem('userPrefs', JSON.stringify(storedUserPrefs));
    }
  }




  // ONLOAD: READ LOCALSTORAGE AND UPDATE HTML
  function orderLocalStorage(order) {
    let localStorageKeys = Object.keys(window.localStorage);

    if (localStorageKeys.length === 1) { // if only key is userPrefs
      return;
    }

    let parsedLocalStorage = {};
    localStorageKeys.forEach(key => {
      if (key !== 'userPrefs') {
        parsedLocalStorage[key] = JSON.parse(getItem(key));
      }
    });

    // extract expense objects into an array
    let expensesArray = extractExpenses(parsedLocalStorage);
    // order that array of expense objects
    let orderedExpenses = orderExpenses(order, expensesArray);
    // make order/reset controls visible
    $('#order-and-reset').attr('style', 'display:flex');
    // addToHTML
    orderedExpenses.forEach(expense => addToHTML(expense['timestamp'], expense['category'], expense['subcategory'], expense['dateKey'], expense['expense']));
  }
  orderLocalStorage(userOrder());




  // EXTRACT EXPENSES FROM LOCALSTORAGE TO ORDER THEM
  function extractExpenses(item) {
    let expenseObjectsArray = [];

    for (let key in item) {
      if (Array.isArray(item[key])) {
        item[key].forEach(expense => {
          let expenseObjectCopy = {};
          for (let field in expense) {
            if (Array.isArray(expense[field])) {
              expenseObjectCopy[field] = expense[field].slice();
            }
            expenseObjectCopy[field] = expense[field];
          }
          expenseObjectsArray.push(expenseObjectCopy);
        });
      } else if (typeof item[key] === 'object') {
        expenseObjectsArray = expenseObjectsArray.concat(extractExpenses(item[key]));
      }
    }

    return expenseObjectsArray;
  };




  // ORDER EXPENSES ARRAY BEFORE addToHTML
  function orderExpenses(order, array) {
    if (order === 'newest') {
      return array.sort((a, b) => parseInt(a['dateKey'].join(''), 10) - parseInt(b['dateKey'].join(''), 10));
    } else if (order === 'oldest') {
      return array.sort((a, b) => parseInt(b['dateKey'].join(''), 10) - parseInt(a['dateKey'].join(''), 10));
    }
  }




  // CREATE AND UPDATE
  // $('#amount').keyup(function(event) {
  //   why is enter working???
  // });
  $('#addExpense').click(function(event) {
    event.preventDefault(); // prevent refresh!

    // collect the input
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
      // create or update data structure
      createDataStructure(timestamp, category, subcategory, dateKey, expense);
      $('#amount').val('').focus();
    }
  });




  // CREATE OR UPDATE DATA STRUCTURE AFTER ADDING NEW EXPENSE
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
          parsedLocalStorage[dateKey[1]][dateKey[2]].push(newExpenseObj);
        } else { // if day does not exist
          parsedLocalStorage[dateKey[1]][dateKey[2]] = [newExpenseObj];
        }
      } else { // if month does not exist
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

    detachAndClearExpenses();
    orderLocalStorage(userOrder());
  }




  // DISPLAY EXPENSES
  function addToHTML(timestamp, category, subcategory, dateKey, expense) {
    // format date
    let year = dateKey[0]; // at this point dateKey is an array, not a string
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
    let day = parseInt(dateKey[2], 10).toString();
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
    dateKey = dateKey.join('-');

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
  }




  // DETACH AND CLEAR EXPENSES
  function detachAndClearExpenses() {
    let orderAndReset = $('#order-and-reset').detach();
    let expenses = $('#expenses');
    expenses.empty();
    expenses.prepend(orderAndReset);
  }




  // ORDER AND RESET
  $('#order-and-reset').on('click', 'button', function(event) {
    detachAndClearExpenses();

    if ($(this).attr('id') === 'newest') {
      userOrder('newest'); // set userPref
      orderLocalStorage('newest');
    } else if ($(this).attr('id') === 'oldest') {
      userOrder('oldest'); // set userPref
      orderLocalStorage('oldest');
    } else if ($(this).attr('id') === 'reset') {
      $(this).parent().attr('style', 'display:none');
      let userPrefs = getItem('userPrefs'); // local userPrefs variable
      clearEverything();
      createItem('userPrefs', userPrefs);
    }
  });




  // DELETE INDIVIDUAL EXPENSES
  $('#expenses').on('click', '.delete', function(event) {
    let timestamp = parseInt(this.dataset.timestamp, 10);
    let dateKey = this.dataset.datekey.split('-');
    let parsedLocalStorage = JSON.parse(getItem(dateKey[0]));
    let expenseArray = parsedLocalStorage[dateKey[1]][dateKey[2]];

    expenseArray.forEach((obj, index, arr) => {
      if (obj['timestamp'] === timestamp) {
        arr.splice(index, 1);
      }
    });

    // if expenseArray is empty
    if (expenseArray.length === 0) {
      delete parsedLocalStorage[dateKey[1]][dateKey[2]];
    }

    // if month obj is empty
    if (Object.keys(parsedLocalStorage[dateKey[1]]).length === 0) {
      delete parsedLocalStorage[dateKey[1]];
    }

    // if year obj is empty
    if (Object.keys(parsedLocalStorage).length === 0) {
      deleteItem(dateKey[0]);
      if (window.localStorage.length === 1) {
        $('#order-and-reset').attr('style', 'display:none');
      }
    } else {
      updateItem(dateKey[0], JSON.stringify(parsedLocalStorage));
    }

    // remove HTML expense div
    $(this).parent().remove();
  });




  // CATEGORY - SHOW INPUT
  // $('form').on('click', function(event) {
  //   if (event.target.className === 'far fa-plus-square') {
  //     showCategoryInput();
  //   } else if (event.target.className === 'far fa-minus-square') {
  //     removeCategory();
  //   }
  // });

  // function addCategory() {
  //   // select id 'category'
  //   let select = $('#category');
  //   let parent = $('#category-div');
  //   // remove it
  //   select.attr('style', 'display:none');
  //   // add input field
  //   parent.append(
  //     `<input id="add-cat" type="text">`
  //   );
  //   $('#add-cat').focus();
  // }

  // $()


  // UPDATE SUBCATEGORIES




  // when deleting categories/subcategories, must delete related expenses too
});