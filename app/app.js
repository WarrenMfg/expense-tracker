/*
TODO
- add jQuery effects when adding expense
- add c3js graph
- ability to delete category and subcategory
- add indication of current expense order
- edit category and subcategory names
- validation, when adding cat and subcat, to prohibit overwritting duplicate category and notify of missing info
- reorder categories and subcategories alphabetically, while still selecting them after adding them
- utilitiy function: when click anywhere on HTML, remove inputs, show select elements, remove delete cats/subs
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
    userPrefs.push('newest'); // default
    userPrefs.push({});
    createItem('userPrefs', JSON.stringify(userPrefs));
  } else {
    loadCategoriesToCategorySelectOption();
  }

  function userOrder(order) {
    let parsedUserPrefs = JSON.parse(getItem('userPrefs'));
    if (arguments.length === 0) { // getter
      return parsedUserPrefs[0];
    } else { // setter
      parsedUserPrefs[0] = order;
      updateItem('userPrefs', JSON.stringify(parsedUserPrefs));
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
    let category = $('#category')[0].value;
    let subcategory = $('#subcategory')[0].value;
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




  // ADD CATEGORY/SUBCATEGORY
  $('form').on('click', 'i', function(event) {
    if (event.target.id === 'add-cat') {
      showOrHideBothInputs();
    } else if (event.target.id === 'minus-cat') {
      deleteCategory('minus-cat');
    } else if (event.target.id === 'add-sub') {
      showOrHideSubcategoryInput();
    } else if (event.target.id === 'minus-sub') {
      console.log('minus-sub');
    }
  });

  function showOrHideBothInputs(addedCategory, addedSubcategory) {
    let catSelectElement = $('#category');
    let subSelectElement = $('#subcategory');
    let catParent = $('#category-div');
    let subParent = $('#subcategory-div');

    // if previously clicked subcategory plus button, then clicked category plus button
    if (catSelectElement.attr('class') === undefined && subSelectElement.attr('class') === 'hidden') {
      catSelectElement.attr('class', 'hidden');
      catParent.append(
        `<input id="cat-input" type="text" placeholder="Add a Category">`
      );
      $('#cat-input').focus();
      return;
    }

    if (catSelectElement.attr('class') === 'hidden') { // remove inputs, show selects
      $('#cat-input').remove();
      $('#sub-input').remove();
      catSelectElement.removeAttr('class'); // may not need
      subSelectElement.removeAttr('class'); // may not need
      // if category was entered
      if (arguments.length > 0) {
        let catOptionIndex = catSelectElement.find(`option[value=${addedCategory}]`)[0].index;
        catSelectElement[0].selectedIndex = catOptionIndex;
        refreshSubcategories(addedCategory, addedSubcategory);
        let subOptionIndex = subSelectElement.find(`option[value=${addedSubcategory}]`)[0].index;
        subSelectElement[0].selectedIndex = subOptionIndex;
      }
    } else { // remove selects, show inputs
      catSelectElement.attr('class', 'hidden');
      subSelectElement.attr('class', 'hidden');

      catParent.append(
        `<input id="cat-input" type="text" placeholder="Add a Category">`
      );
      subParent.append(
        `<input id="sub-input" type="text" placeholder="Add a Subcategory">`
      );

      $('#cat-input').focus();
    }
  }

  function showOrHideSubcategoryInput(selectedCategory, addedSubcategory) {
    let catSelectElement = $('#category');
    let subSelectElement = $('#subcategory');
    let subParent = $('#subcategory-div');

    if (catSelectElement.attr('class') === 'hidden' && subSelectElement.attr('class') === 'hidden') {
      $('#cat-input').remove();
      catSelectElement.removeAttr('class');
      $('#sub-input').focus();
      return;
    }

    if (subSelectElement.attr('class') === 'hidden') { // remove input, show select
      $('#sub-input').remove();
      subSelectElement.removeAttr('class');
      // if new subcategory was entered, arguments will be passed in
      if (arguments.length > 0) {
        refreshSubcategories(selectedCategory, addedSubcategory);
        let subOptionIndex = subSelectElement.find(`option[value=${addedSubcategory}]`)[0].index;
        subSelectElement[0].selectedIndex = subOptionIndex;
      }
    } else { // remove select, show input
      subSelectElement.attr('class', 'hidden');
      subParent.append(
        `<input id="sub-input" type="text" placeholder="Add a Subcategory">`
      );

      $('#sub-input').focus();
    }
  }

  // on category and/or subcategory input (using enter key)
  $('#subcategory-div').on('keyup', '#sub-input', function(event) {
    if (event.keyCode === 13) {
      let catSelectElement = $('#category');
      let subInput = $('#sub-input');

      // if both inputs are visible (adding a category and subcategory)
      if (catSelectElement.attr('class') === 'hidden') {
        let catInput = $('#cat-input');
        let bothHaveValues = !!catInput[0].value && !!subInput[0].value;
        if (bothHaveValues) {
          let titleCaseArray = addCategoryAndSubcategoryToUserPrefs(catInput[0].value, subInput[0].value);
          loadCategoriesToCategorySelectOption();
          showOrHideBothInputs(titleCaseArray[0], titleCaseArray[1]);
        } else {
          if (!catInput[0].value && !subInput[0].value) {
            inputFeedback('catInput', 'subInput');
          } else if (!catInput[0].value) {
            inputFeedback('catInput');
          } else if (!subInput[0].value) {
            inputFeedback(null, 'subInput');
          }
        }
      } else { // just adding subcategory
        if (catSelectElement[0].value !== '' && !!subInput[0].value) {
          let titleCaseSubInput = addSubcategoryToCategory(catSelectElement[0].value, subInput[0].value);
          showOrHideSubcategoryInput(catSelectElement[0].value, titleCaseSubInput);
        } else {
          if (catSelectElement[0].value === '') {
            inputFeedback('catSelectElement');
          }
          if (!subInput[0].value) {
            inputFeedback(null, 'subInput');
          }
        }
      }
    }
  });

  function addCategoryAndSubcategoryToUserPrefs(category, subcategory) {
    let parsedUserPrefs = JSON.parse(getItem('userPrefs'));
    let categories = parsedUserPrefs[1];
    let argumentsArray = [category, subcategory];

    // title case
    argumentsArray = argumentsArray.map(string => {
      string = string.toLowerCase();
      string = string.charAt(0).toUpperCase() + string.slice(1);
      return string;
    });

    categories[argumentsArray[0]] = [argumentsArray[1]];
    parsedUserPrefs[1] = categories;
    updateItem('userPrefs', JSON.stringify(parsedUserPrefs));
    return argumentsArray;
  }

  function addSubcategoryToCategory(category, subcategory) {
    let parsedUserPrefs = JSON.parse(getItem('userPrefs'));
    let categories = parsedUserPrefs[1];

    // title case
    subcategory = subcategory.toLowerCase();
    subcategory = subcategory.charAt(0).toUpperCase() + subcategory.slice(1);

    categories[category].push(subcategory);
    parsedUserPrefs[1] = categories;
    updateItem('userPrefs', JSON.stringify(parsedUserPrefs));
    return subcategory;
  }

  function loadCategoriesToCategorySelectOption() {
    let parsedUserPrefs = JSON.parse(getItem('userPrefs'));
    let categoriesArray = Object.keys(parsedUserPrefs[1]);
    let categorySelectElement = $('#category');

    // empty current options to prevent duplicates
    let blankOption = categorySelectElement.children().first().detach();
    categorySelectElement.empty();
    categorySelectElement.prepend(blankOption);


    // add all categories
    categoriesArray.sort();
    categoriesArray.forEach(category => {
      categorySelectElement.append(`
      <option value="${category}">${category}</option>
      `);
    });
  }

  // change subcategories based on selected category
  $('#category').change(function(event) {
    refreshSubcategories(event);
  });

  function refreshSubcategories(event, addedSubcategory) {
    let blankOption;
    let subcategorySelectElement = $('#subcategory');
    let chosenCategory = event.target ? event.target.value : event; // on change vs. entering new subcategory

    // empty current options to prevent duplicates
    blankOption = subcategorySelectElement.children().first().detach();
    subcategorySelectElement.empty();
    subcategorySelectElement.prepend(blankOption);

    if (chosenCategory === '' || chosenCategory === undefined) {
      return;
    }

    let parsedUserPrefs = JSON.parse(getItem('userPrefs'));
    let subcategories = parsedUserPrefs[1][chosenCategory];

    subcategories.sort();
    subcategories.forEach(subcategory => {
      subcategorySelectElement.append(`
        <option value="${subcategory}">${subcategory}</option>
      `);
    });
  }

  function inputFeedback(category, subcategory, date, amount) {
    let catSelectElement = $('#category');
    let subSelectElement = $('#subcategory');
    let catInput = $('#cat-input');
    let subInput = $('#sub-input');

    if (category === 'catInput') {
      catInput.attr('style', 'transition:background-color 0.2s ease; background-color:#f4cccc');
      catInput.focus();
      setTimeout(function() {
        catInput.attr('style', 'transition:background-color 0.2s ease; background-color:white');
      }, 2000);
    }
    if (category === 'catSelectElement') {
      catSelectElement.attr('style', 'transition:background-color 0.2s ease; background-color:#f4cccc');
      catSelectElement.focus();
      setTimeout(function() {
        catSelectElement.attr('style', 'transition:background-color 0.2s ease; background-color:white');
      }, 2000);
    }

    if (subcategory === 'subInput') {
      subInput.attr('style', 'transition:background-color 0.2s ease; background-color:#f4cccc');
      if (category === null) {
        subInput.focus();
      }
      setTimeout(function() {
        subInput.attr('style', 'transition:background-color 0.2s ease; background-color:white');
      }, 2000);
    }
    if (subcategory === 'subSelectElement') {

    }

    if (date === 'date') {

    }

    if (amount === 'amount') {

    }
  }




  // DELETE CATEGORY/SUBCATEGORY
  function deleteCategory(flyout) {
    // make both hidden/remove both flyouts
    // if flyout is 'minus-cat'
      // get categories
      // add to flyout with delete x button
      // show 'minus-cat' flyout
  }



  // when category is deleted loadCategoriesToCategorySelectOption()

  // UPDATE SUBCATEGORIES




  // when deleting categories/subcategories, must delete related expenses too
});