function getTimeZone() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
}

function changeTZ() {
  var html = HtmlService.createHtmlOutputFromFile('changeTZ')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setWidth(460)
      .setHeight(420);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showModalDialog(html, 'Change your Spreadsheet Settings');
}

function showEnterTweets() {
  var html = HtmlService.createHtmlOutputFromFile('enterTweets')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setWidth(400)
      .setHeight(170);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showModalDialog(html, 'No Tweets Found');
}

function activateEntry() {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Add Tweets').getRange(3,2).activate();
  return;
}

function showReset() {
  var html = HtmlService.createHtmlOutputFromFile('reset')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setWidth(460)
      .setHeight(200);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
  .showModalDialog(html, 'Warning!');
  
}

function showDelayHint() {
  var html = HtmlService.createHtmlOutputFromFile('delayHelp')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setWidth(460)
      .setHeight(200);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showModalDialog(html, 'Interval or Duration');
}

function showSaveHint() {
  var html = HtmlService.createHtmlOutputFromFile('saveJob')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setWidth(460)
      .setHeight(200);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showModalDialog(html, 'Save for Later');
}

function showError(msg, fixAction) {
  var template = HtmlService.createTemplateFromFile('Error Message');
  template.errorMessage = msg;
  template.fix = "google.script.run." + fixAction;
  var page = template.evaluate();
  SpreadsheetApp.getUi().showModalDialog(template, 'Error');
}

function getToday() {
  var date = new Date();
  date = Utilities.formatDate(date, getTimeZone(), 'yyyy-MM-dd');
  return date;
}

function getNow() {
  var time = new Date();
  time.setMinutes(time.getMinutes() + 5);
  time = Utilities.formatDate(time, getTimeZone(), 'HH:mm');
  return time;
}

function runJob(formData) {
  // testing
  //formData = { time:'15:15', datePicker: '2015-04-03', interval_value: '', duration_value: '56', delay: '#duration', append: 'on', hashtag: '#test', saveCheckbox: 'on', saveName: 'jobName'};
  
  
  //begin code
  Logger.log(formData);
  if (!checkSheets) {
    displayError('Incorrect sheet set up detected.','setupSheet()');
    return;
  }
  var date = formData.datePicker;
  var calTimes = doStartAndEnd(formData);
  var interval = getInterval(formData);
  if (!calTimes || !interval) {
    Browser.msgBox("Please enter either an interval to wait between tweets, or a total duration for the job.");
    return false;
  }
  if (!verifyStartTime(calTimes[0])) {
    Browser.msgBox('Please make sure that your start time is at least two minutes in the future.');
    return false;
  } else {
    var time = formData.time;
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Add Tweets');
  if (formData.append == 'on') {
    Logger.log("Append");
    appendTweets(formData.hashtag);
  }
  
  sheet.getRange(1,1,1,6).setValues([['Start Date', date, 'Start Time:', time, 'Interval', interval]]);
  
  return doTweetJob(sheet);
}

function saveJob(formData) {
  // testing
  //formData = { time:'15:15', datePicker: '2015-04-03', interval_value: '', duration_value: '56', delay: '#duration', append: 'on', hashtag: '#test', saveCheckbox: 'on', saveName: 'jobName'};
  
  
  //begin code
  Logger.log(formData);
  var date = formData.datePicker;
  var calTimes = doStartAndEnd(formData);
  var interval = getInterval(formData);
  if (!calTimes || !interval) {
    Browser.msgBox("Please enter either an interval to wait between tweets, or a total duration for the job.");
    return false;
  }
 
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Add Tweets');
  var storedSuccessfully = storeJob(formData.saveName, interval);
  if (!storedSuccessfully) {
    return false;
  }
  return true;
}

function getInterval(formData) {
  var time = formData.time;
  var date = formData.datePicker;
  var timeArray = time.split(':');
  var dateArray = date.split('-');
  var start = new Date(dateArray[0], dateArray[1]-1, dateArray[2], timeArray[0], timeArray[1], 0, 0);
  switch (formData.delay) {
    case '#interval': 
      if (formData.interval_value == '') {
        return false;
      }
      var interval = formData.interval_value;
      break;
    case '#duration':
      if (formData.duration_value == '') {
        return false;
      }
      var duration = parseInt(formData.duration_value);
      var numberOfTweets = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Add Tweets').getLastRow() - 2;
      var interval = Math.floor(duration/numberOfTweets);
      if (interval < 1) {
        interval = 1;
      }
      break;
  }
  return interval;
}

function getSavedInterval() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var Tweets = ss.getSheetByName('Add Tweets');
  var interval = Tweets.getRange(1,6).getValue();
  Logger.log('Interval: ' + interval);
  return interval;
}

function doTweetJob(sheet) {
  //testing
  sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Add Tweets');
  
  //begin code
  calculateTimes(sheet);
  start();
  //refreshTriggers();
  return true;
}

function verifyStartTime(verifyDate) {
  //testing
  
  
  //begin code
  var gmtVerify = handleTZ(verifyDate);
  Logger.log('Verify: ' + gmtVerify);
  var rightNowDate = new Date();
  rightNowDate.setMinutes(rightNowDate.getMinutes() + 1);
  Logger.log('Right now: ' + rightNowDate);
  var passed = gmtVerify.getTime() > rightNowDate.getTime();
  Logger.log('Verification status: ' + passed);
  return passed;
}

function deAuthorize() {
  clearService();
  SpreadsheetApp.getActiveSpreadsheet()
  .toast('You have removed authorization. Birdfeeder can no longer tweet on your behalf.', 'Authorization removed', 7);
  showSidebar();
  ScriptApp.invalidateAuth();
}

function clear() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (i in sheets) {
    sheets[i].setName(i);
  }
  setupSheet();
  killTriggers();
  for (i in sheets) {
    ss.deleteSheet(sheets[i]);
  }
  //deAuthorize();
}
