/*
TODO
- change date on expense card
- add total expense below chart
- space in cat/sub
- add jQuery effects when adding expense
- make tooltip only on one line
- improve CSS
- edit category and subcategory names (edit button next to plus and minus buttons)
- validation, when adding cat and subcat, to prohibit overwritting duplicate category and notify of missing info
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




  // ADD TODAY'S DATE IN DATE PICKER
  function addTodaysDate() {
    let datePicker = $('#date');
    let todaysDate = new Date();
    let month = (todaysDate.getMonth() + 1).toString();
    let day = todaysDate.getDate().toString();
    let year = todaysDate.getFullYear().toString();

    if (month.length === 1) {
      month = '0' + month;
    }
    if (day.length === 1) {
      day = '0' + day;
    }

    datePicker[0].value = `${year}-${month}-${day}`;
  }
  addTodaysDate();




  // GENERATE CHART AND CHART COLORS
  let myColors = [
    '#0a7b83', '#2AA876', '#FFD265', '#F19C65', '#CE4D45', // light
    '#074D52', '#1A6949', '#AB8C44', '#B3744B', '#8F362F', // medium
    '#043236', '#11422E', '#705C2D', '#6E472E', '#4F1E1A']; // dark

  let chart = c3.generate({
    bindto: '#chart',
    data: {
      type: 'pie',
      columns: [],
      labels: true,
      color: function(color, d) {
        if (typeof d === 'object') {
          chart.data.columns.forEach(function(column, index) {
            if (column[0] === d.id) {
              color = myColors[index];
            }
          });
          expenseItemHeaderColor(color, d.id);
          return color;
        } else {
          chart.data.columns.forEach(function(column, index) {
            if (column[0] === d) {
              color = myColors[index];
            }
          });
          return color;
        }
      }
    },
    pie: {
      label: {
        format: function(v) {
          return v.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2});
        }
      }
    },
    size: {
      width: 550,
      height: 550
    },
    tooltip: {
      format: {
        name: function(name, ratio, id, index) {
          return `${name} ${(ratio * 100).toFixed(2)}%`;
        },
        value: function(value, ratio, d) {
          return `${value.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
      }
    }
  });




  // ORDER OF EXPENSES IN EXPENSE LIST
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
      $('#reset').trigger('click');
      return;
    }

    // add indication of current order to button
    let notOrder = (order === 'oldest') ? 'newest' : 'oldest';
    $(`#${order}`).attr('class', 'current-order');
    $(`#${notOrder}`).removeAttr('class');

    // parse expenses in localStorage
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

    updateChartData();
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

    let dateFormat = formatDateForCard(dateKey);
    dateKey = dateKey.join('-');

    // prepend to list of expenses
    let orderAndReset = $('#order-and-reset');
    orderAndReset.after(`
    <div class="expenseItem">
      <div>
        <p class="date-header" data-category="${category}">
          <span>${category}</span>
          <span>${subcategory}</span>
        </p>
        <div class="card-info">
          <p class="editable-expense" contenteditable="true">${parseFloat(expense).toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          <p>${dateFormat}</p>
        </div>
      </div>

      <button class="delete" data-timestamp="${timestamp}" data-datekey="${dateKey}" title="Delete">Delete</button>
    </div>`);
  }




  // FORMAT DATE
  function formatDateForCard(date) {
    // format date
    let year = date[0];
    let month = date[1];
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
    let day = parseInt(date[2], 10).toString();
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

    return `${dayOfWeekObj[dayOfWeek]},<br>${monthObj[month]} ${day},<br>${year}`;
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
    let newest = $('#newest');
    let oldest = $('#oldest');

    if ($(this).attr('id') === 'newest') {
      userOrder('newest'); // set userPref
      orderLocalStorage('newest');
      newest.attr('class', 'current-order');
      oldest.removeAttr('class');

    } else if ($(this).attr('id') === 'oldest') {
      userOrder('oldest'); // set userPref
      orderLocalStorage('oldest');
      oldest.attr('class', 'current-order');
      newest.removeAttr('class');

    } else if ($(this).attr('id') === 'reset') {
      $(this).parent().attr('style', 'display:none');
      let userPrefs = getItem('userPrefs'); // local userPrefs variable
      clearEverything();
      createItem('userPrefs', userPrefs);
      chart.unload();
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
    // update chart
    updateChartData();
  });




  // ADD CATEGORY/SUBCATEGORY
  $('form').on('click', 'i', function(event) {
    if (event.target.id === 'add-cat') {
      showOrHideBothInputs();
    } else if (event.target.id === 'minus-cat') {
      deleteCategory();
    } else if (event.target.id === 'add-sub') {
      showOrHideSubcategoryInput();
    } else if (event.target.id === 'minus-sub') {
      deleteSubcategory();
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

  function refreshSubcategories(event, addedSubcategory) { // may not need second argument
    let blankOption;
    let subcategorySelectElement = $('#subcategory');
    let chosenCategory = (typeof event === 'object') ? event.target.value : event; // onchange vs. entering new subcategory

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
  function deleteCategory() {
    let catSelectElement = $('#category');
    if (catSelectElement[0].value === '') {
      return;
    }

    let localStorageKeys = Object.keys(window.localStorage);
    let userCategories = {};
    let parsedUserPrefs;
    let parsedLocalStorage = {};
    localStorageKeys.forEach(key => {
      if (key === 'userPrefs') {
        parsedUserPrefs = JSON.parse(getItem(key)); // array
        userCategories = parsedUserPrefs[1]; // object
      } else {
        parsedLocalStorage[key] = JSON.parse(getItem(key));
      }
    });

    // delete selected category expenses from localStorage, update expenses in localStorage
    let updatedLocalStorage = deleteExpenses(parsedLocalStorage, catSelectElement[0].value, 'category');
    clearEverything();
    if (Object.keys(updatedLocalStorage).length > 0) {
      for (let key in updatedLocalStorage) {
        createItem(key, JSON.stringify(updatedLocalStorage[key]));
      }
    }

    // delete selected category from userPrefs, update userPrefs in localStorage
    delete userCategories[catSelectElement[0].value];
    parsedUserPrefs[1] = userCategories;
    updateItem('userPrefs', JSON.stringify(parsedUserPrefs));

    // update select elements and html
    loadCategoriesToCategorySelectOption();
    refreshSubcategories();
    detachAndClearExpenses();
    orderLocalStorage(userOrder());
  }

  function deleteExpenses(item, catOption, keyOfInterest, subOption) {
    let newLocalStorage = {};

    for (let key in item) {
      if (Array.isArray(item[key])) {
        newLocalStorage[key] = item[key].filter(expense => {
          if (arguments[arguments.length - 1] === undefined) {
            return expense[keyOfInterest] !== catOption;
          } else {
            return !(expense[keyOfInterest] === subOption && expense['category'] === catOption);
          }
        });
        if (newLocalStorage[key].length === 0) {
          delete newLocalStorage[key];
        }
      } else {
        newLocalStorage[key] = deleteExpenses(item[key], catOption, keyOfInterest, subOption);
        if (Object.keys(newLocalStorage[key]).length === 0) {
          delete newLocalStorage[key];
        }
      }
    }

    return newLocalStorage;
  }

  function deleteSubcategory() {
    let catSelectElement = $('#category');
    let subSelectElement = $('#subcategory');
    if (subSelectElement[0].value === '') {
      return;
    }

    let localStorageKeys = Object.keys(window.localStorage);
    let userCategories = {};
    let parsedUserPrefs;
    let parsedLocalStorage = {};
    localStorageKeys.forEach(key => {
      if (key === 'userPrefs') {
        parsedUserPrefs = JSON.parse(getItem(key)); // array
        userCategories = parsedUserPrefs[1]; // object
      } else {
        parsedLocalStorage[key] = JSON.parse(getItem(key));
      }
    });

    // delete selected subcategory expenses from localStorage, update expenses in localStorage
    let updatedLocalStorage = deleteExpenses(parsedLocalStorage, catSelectElement[0].value,  'subcategory', subSelectElement[0].value);
    clearEverything();
    if (Object.keys(updatedLocalStorage).length > 0) {
      for (let key in updatedLocalStorage) {
        createItem(key, JSON.stringify(updatedLocalStorage[key]));
      }
    }

    // delete selected subcategory from userPrefs, update userPrefs in localStorage
    let indexOfSubcategory = userCategories[catSelectElement[0].value].indexOf(subSelectElement[0].value);
    userCategories[catSelectElement[0].value].splice(indexOfSubcategory, 1);
    parsedUserPrefs[1] = userCategories;
    updateItem('userPrefs', JSON.stringify(parsedUserPrefs));

    // update select elements and html
    refreshSubcategories(catSelectElement[0].value);
    detachAndClearExpenses();
    orderLocalStorage(userOrder());
  }




  // EDIT CATEGORIES AND SUBCATEGORIES
  $('#expenses').on('click', '.date-header span', function(event) {
    // info for editCatAndSub
    let target = $(event.target);
    let allSpans = $('.date-header').children();
    let spans = target.parent().children();
    let parsedCatsAndSubs = JSON.parse(getItem('userPrefs'))[1];
    let categories = Object.keys(parsedCatsAndSubs).sort();

    // remove .editable-expense class so .edit-mode won't be added to it
    let editableExpense = target.parentsUntil('#expenses').find('.editable-expense');
    editableExpense.removeClass('editable-expense');
    // change contentEditable to false and add inline style to negate hover state;
    editableExpense[0].contentEditable = false;
    editableExpense.attr('style', 'cursor:text; font-style:normal;');

    // grab delete button and change to 'update' button
    let button = target.parentsUntil('#expenses').find('button');
    button.removeClass('delete');
    button.addClass('update');
    button[0].innerText = 'Update';
    button[0].title = 'Update';

    editCatAndSub(spans[0].innerText, spans[1].innerText, spans, parsedCatsAndSubs, categories);

  });

  // turn spans to select elements
  function editCatAndSub(category, subcategory, spans, catsAndSubsObj, catsArray) {
    let headerParagraph = spans.parent()[0];
    let currentCatAndSub = spans.detach();
    let subcategories = catsAndSubsObj[category].sort();
    let catSelectElement = $('<select class="cat-sub-select" id="cardCat" style="grid-area:cat"></select>');
    let subSelectElement = $('<select class="cat-sub-select" id="cardSub" style="grid-area:sub"></select>');

    // append categories to select element
    let catIndex;
    let subIndex;
    $(catsArray).each((i, cat) => {
      catSelectElement.append(`<option value="${cat}">${cat}</option>`);
      if (cat === category) {
        catIndex = i;
      }
    });

    // append subcategories to select element
    $(subcategories).each((i, sub) => {
      subSelectElement.append(`<option value="${sub}">${sub}</option>`);
      if (sub === subcategory) {
        subIndex = i;
      }
    });

    // append to header
    $(headerParagraph).addClass('header-edit');
    $(headerParagraph).append(catSelectElement, subSelectElement);

    // select current category and subcategory
    catSelectElement[0].selectedIndex = catIndex;
    subSelectElement[0].selectedIndex = subIndex;
  }

  // update subcategories on category change
  $('#expenses').on('change', '#cardCat', function(event) {
    refreshCardSubcategories(event);
  });

  function refreshCardSubcategories(event) {
    let parsedCatsAndSubs = JSON.parse(getItem('userPrefs'))[1];
    let subSelectElement = $('#cardSub');
    let selection = event.target.value;
    let subcategories = parsedCatsAndSubs[selection].sort();

    subSelectElement.empty();
    $(subcategories).each((i, subcategory) => {
      subSelectElement.append(`
        <option value="${subcategory}">${subcategory}</option>
      `);
    });
  }

  // after selection is made update localStorage
  $('#expenses').on('click', '.update', function(event) {
    let target = $(event.target);
    // get cat and sub values
    let updatedCatAndSub = $('.cat-sub-select');
    let updatedCat = updatedCatAndSub[0].value;
    let updatedSub = updatedCatAndSub[1].value;

    // remove select elements, add new cat/sub spans, remove .header-edit (for padding)
    updatedCatAndSub.remove();
    let dateHeader = target.parentsUntil('#expenses').find('.date-header');
    dateHeader.attr('data-category', updatedCat);
    dateHeader.append(`<span>${updatedCat}</span><span>${updatedSub}</span`);
    dateHeader.removeClass('header-edit');

    // remove .update from button, add .delete, change innerText
    target.removeClass('update');
    target.addClass('delete');
    target[0].innerText = 'Delete';

    // add .editable-expense back to expense, make contenteditable = true, and remove inline styles
    let editableExpense = target.parentsUntil('#expenses').find('.card-info p:first-child');
    editableExpense.addClass('editable-expense');
    editableExpense[0].contentEditable = true;
    editableExpense.removeAttr('style');

    // update localStorage
    cardCatAndSub_UpdateLocalStorage(updatedCat, updatedSub, target);

  });

  function cardCatAndSub_UpdateLocalStorage(category, subcategory, button) {
    let dateKeyArray = button[0].dataset['datekey'].split('-');
    let timestamp = parseInt(button[0].dataset['timestamp'], 10);
    let year = JSON.parse(getItem(dateKeyArray[0]));
    let month = year[dateKeyArray[1]];
    let dayOfExpenses = month[dateKeyArray[2]];

    // update expense
    dayOfExpenses = dayOfExpenses.reduce(function(acc, cur, i, arr) {
      if (cur['timestamp'] === timestamp) {
        cur['category'] = category;
        cur['subcategory'] = subcategory;
        acc.push(cur);
      } else {
        acc.push(cur);
      }
      return acc;
    }, []);

    // update localStorage
    year[dateKeyArray[1]][dateKeyArray[2]] = dayOfExpenses;
    updateItem(dateKeyArray[0], JSON.stringify(year));

    // update chart
    updateChartData();
  }




  // EDIT EXPENSE AMOUNT
  $('#expenses').on('click', '.editable-expense', function(event) { // innerText
    let target = $(event.target);
    // set value to parsed value

    // provide indication of edit mode
    if (!target.hasClass('edit-mode')) {
      event.target.innerText = removeDollarSignAndCommas(event.target.innerText);
      target.addClass('edit-mode');
    }
  });

  function removeDollarSignAndCommas(expense) {
    // capture original amount
    let amount = expense.split('');

    // remove dollar sign
    if (amount[0] === '$') {
      amount.splice(0, 1);
    }

    // remove comma(s)
    amount = amount.map((num, i, arr) => {
      if (num !== ',') {
        return num;
      }
    });

    // parse
    return amount.join('');
  }

  // on enter
  $('#expenses').on('keypress', '.editable-expense', function(event) {
    if (event.keyCode === 13) {
      event.target.contentEditable = 'false';
    }
  });

  // on blur (pressing enter blurs editable content)
  $('#expenses').on('blur', '.editable-expense', function(event) {
    event.target.contentEditable = 'false';
    let expense = removeDollarSignAndCommas(event.target.innerText);
    event.target.innerText = parseFloat(expense).toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2});
    $(event.target).removeClass('edit-mode');
    event.target.contentEditable = 'true';
    let expenseCard = $(this).parentsUntil('#expenses');

    updateEdit(expenseCard, expense);
  });

  function updateEdit(expenseEvent, expenseString) {
    // grab expense content
    let timestamp = parseInt(expenseEvent.find('button').attr('data-timestamp'), 10);
    let category = expenseEvent.find('.date-header').attr('data-category');
    let subcategory = expenseEvent.find('.date-header span')[1].innerText;
    let dateKey = expenseEvent.find('button').attr('data-datekey');
    let dateKeyArray = dateKey.split('-');

    // edit the expense
    let parsedLocalStorage = JSON.parse(getItem(dateKeyArray[0]));
    let dayOfExpense = parsedLocalStorage[dateKeyArray[1]][dateKeyArray[2]];
    let expenseObj;
    dayOfExpense = dayOfExpense.reduce(function(acc, cur, i, arr) {
      if (cur['timestamp'] === timestamp) {
        expenseObj = cur;
        cur['expense'] = expenseString;
        acc.push(cur);
      } else {
        acc.push(cur);
      }
      return acc;
    }, []);

    // update localStorage
    parsedLocalStorage[dateKeyArray[1]][dateKeyArray[2]] = dayOfExpense;
    updateItem(dateKeyArray[0], JSON.stringify(parsedLocalStorage));

    // update chart
    updateChartData();
  }




  // EDIT DATE
  $('#expenses').on('click', '.card-info p:last-child', function(event) { // innerHTML
    let target = $(event.target);
    let cardInfo = target.parent();
    let button = target.parentsUntil('#expenses').find('button');
    let dateKey = button[0].dataset['datekey'].split('-');


    // remove paragraph element and append datepicker
    target.remove();
    cardInfo.append(`
      <div><input class="edit-date" type="date" pattern="\d{4}-\d{2}-\d{2}"></div>
    `);

    // fill with current date
    // let datePicker = cardInfo.find('.edit-date');
    // datePicker[0].value = `${dateKey[0]}-${dateKey[1]}-${dateKey[2]}`;
  });

  // update date on date change
  $('#expenses').on('change', '.edit-date', function(event) {
    let target = $(event.target);
    let newDate = target[0].value.split('-');
    let cardInfo = target.parent();
    let button = target.parentsUntil('#expenses').find('button');
    let dateKey = button[0].dataset['datekey'].split('-');
    let timestamp = parseInt(button[0].dataset['timestamp'], 10);
    let parsedLocalStorage = JSON.parse(getItem(window.localStorage)); // cannot do this
    delete parsedLocalStorage['userPrefs'];

    let expensesArray = extractExpenses(parsedLocalStorage);
    let expenseToBeEdited;

    // extract expense to be edited
    $(expensesArray).each((i, expense) => {
      if (expense['timestamp'] === timestamp) {
        expenseToBeEdited = expense;
      }
    });

    // remove date picker
    target.remove();

    // update localStorage
    expenseToBeEdited['dateKey'] = newDate;




    console.log(parsedLocalStorge, expenseToBeEdited, newDate);
  });




  // UPDATE CHART
  function updateChartData() {
    let extractedExpenses;
    let expenseColumns = [];
    let categoriesObj = {};
    let localStorageKeys = Object.keys(window.localStorage);
    let parsedLocalStorage = {};

    localStorageKeys.forEach(key => {
      if (key !== 'userPrefs') {
        parsedLocalStorage[key] = JSON.parse(getItem(key));
      }
    });

    // extract expense objects into an array
    extractedExpenses = extractExpenses(parsedLocalStorage);
    // make categoriesObj for category (keys) with array of expenses (values)
    extractedExpenses.forEach(expenseObj => {
      if (Object.keys(categoriesObj).includes(expenseObj.category)) {
        categoriesObj[expenseObj.category].push(parseFloat(expenseObj.expense));
      } else {
        categoriesObj[expenseObj.category] = [];
        categoriesObj[expenseObj.category].push(parseFloat(expenseObj.expense));
      }
    });
    // convert categoriesObj into array of arrays for chart
    for (let cat in categoriesObj) {
      let column = [];
      column.push(cat);
      let sum = parseFloat(categoriesObj[cat].reduce((acc, val) => acc + val).toFixed(2));
      column.push(sum);
      expenseColumns.push(column);
    }
    // sort alphabetically by category name
    expenseColumns = expenseColumns.sort(function(a, b) {
      let cat1 = a[0].toUpperCase();
      var cat2 = b[0].toUpperCase();
      if (cat1 < cat2) {
        return -1;
      } else if (cat1 > cat2) {
        return 1;
      } else {
        return 0;
      }
    });

    chart.data.columns = expenseColumns;
    chart.load({unload: true, columns: expenseColumns});
  }

  function expenseItemHeaderColor(color, category) {
    let dateHeaders = $(`[data-category=${category}]`);

    dateHeaders.each(function(i, header) {
      header.setAttribute('style', `background-color:${color}`);
    });
  }
});