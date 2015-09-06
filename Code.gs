// Get the Twitter consumer key and consumer secret from your Twitter App's page
var CONSUMER_KEY    =  "XXXXXXXXXXXXXXXXXXXXX";
var CONSUMER_SECRET =  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
var PROJECT_KEY =      ScriptApp.getProjectKey();


function showSidebar() {
  doMenu();
  var twitterService = getTwitterService();
  if (!twitterService.hasAccess()) {
    var authorizationUrl = twitterService.authorize();
    var template = HtmlService.createTemplateFromFile('authorization');
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
    page.setTitle('Authorization Required');
    SpreadsheetApp.getUi().showSidebar(page);
  } else {
    var ui = HtmlService.createHtmlOutputFromFile('sidebar')
        .setTitle('Birdfeeder').setWidth(300);
    SpreadsheetApp.getUi().showSidebar(ui);
  }
}

function onOpen(e) {
  if (e && e.authMode == ScriptApp.AuthMode.NONE) {
    var ui = SpreadsheetApp.getUi().createAddonMenu();
    ui.addItem("Setup", "doAuthSetup");
    ui.addToUi();
  } else {
    doMenu();
  }
}

function doGet() {
  showSidebar();
}

function doAuthSetup() {
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
  showSidebar();
}

function doMenu() {
  var twitterService = getTwitterService();
  var ui = SpreadsheetApp.getUi().createAddonMenu();
  if (!checkSheets()) {
    ui.addItem("Setup", "setupSheet");
  } else {
    if (!twitterService.hasAccess() && checkSheets()) {
      ui.addItem("Authorize", "showSidebar");
    } else {
      ui.addItem("Launch", "showSidebar");
      ui.addItem("Revoke Authorization", "deAuthorize");
      ui.addItem("Reset Sheets", "showReset");
    }

  }
  
  ui.addToUi();
}

function checkSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Add Tweets')) {
    return false;
  }
  if (!ss.getSheetByName('Scheduled Jobs')) {
    return false;
  }
  if (!ss.getSheetByName('Errors')) {
    return false;
  }
  if (!ss.getSheetByName('Saved Jobs')) {
    return false;
  }
  return true;
}

function setupSheet() {
  if (checkSheets()) {
    Logger.log('Sheets OK');
    showSidebar();
    return;
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var sheetNames = [];
  for (i in sheets) {
    sheetNames.push(sheets[i].getName());
  }
  var reqSheets = ['Add Tweets','Scheduled Jobs','Errors','Saved Jobs']
  for (i in reqSheets) {
    if (sheetNames.indexOf(reqSheets[i]) < 0) {
      ss.insertSheet(reqSheets[i]);
    }
  }
  
  var savedJobs = ss.getSheetByName('Saved Jobs');
  savedJobs.getRange(2,1).setValue('Saved Jobs live here. Do not delete this sheet.');
  savedJobs.hideSheet();
  var scheduled = ss.getSheetByName('Scheduled Jobs');
  scheduled.getRange(1,1,1,2).setValues([['time','tweet']]);
  scheduled.setFrozenRows(1);
  var errors = ss.getSheetByName('Errors');
  errors.getRange(1,1,1,2).setValues([['Time','Error']]);
  errors.setFrozenRows(1);
  var tweets = ss.getSheetByName('Add Tweets');
  tweets.getRange(1,1,2,6).setValues([['Start Date:',' ','Start Time:',' ','Interval',''],
                                        ['Time','Enter your Tweets below','','','','']]);
  tweets.getRange(1,1,tweets.getMaxRows(),tweets.getMaxColumns()).setNumberFormat('@STRING@');
  tweets.hideRows(1);
  tweets.hideColumns(1);
  tweets.setFrozenRows(2);
  tweets.activate();
  
  doMenu();
  //showSidebar();
}

function onInstall() {
  onOpen();
}

function getStatus() {
  var num = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Scheduled Jobs').getLastRow() - 1;
  Browser.msgBox('There are ' + num + ' tweets scheduled.');
}

function calculateTimes(sheet) {
  //testing
  //var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Add Tweets');
  
  // begin code
  if (sheet.getLastRow() < 3) {
    sheet.getRange(3,2).activate();
    showEnterTweets();
    return false;
  }
  var date = sheet.getRange(1,2).getValue().toString().split('-');
  var time = sheet.getRange(1,4).getValue().toString().split(':');
  date = new Date(date[0],parseInt(date[1],10)-1,date[2],time[0],time[1],0);
  date = date.getTime();
  var interval = sheet.getRange(1,6).getValue();
  for (var i = 3; i <= sheet.getLastRow(); i++) {
    time = handleTZ(new Date(date + (interval*(i-3))*60000));
    sheet.getRange(i,1).setValue(time).setNumberFormat('dd-MM-YYYY HH:mm:ss');
  }
}
  

function start() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Add Tweets');
  var schedule = ss.getSheetByName('Scheduled Jobs');
  if (sheet.getLastRow() < 3) {
    return false;
  }
  for (var i = 3; i <= sheet.getLastRow(); i++) {
    var data = sheet.getRange(i,1,1,2).getValues();
    schedule.getRange(schedule.getLastRow()+1,1,1,2).setValues(data);
    sheet.getRange(i,1,1,2).clear();
    
  }
  schedule.sort(1);
  manageTriggers(schedule.getRange(2,1).getValue());
  Logger.log('End "Start" function');
}

function doNextTweet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Scheduled Jobs');
  var tweet = sheet.getRange(2,2).getValue();
  var status;  
  status = postTweet(tweet);
  SpreadsheetApp.getActiveSpreadsheet().toast('Tweet Posted: ' + tweet);
  sheet.deleteRow(2);
  manageTriggers(sheet.getRange(2,1).getValue());
}

function manageTriggers(next) {
  Logger.log('Start manage triggers');
  killTriggers();
  Logger.log('Creating trigger for ' + next);
  if (next) {
    setTrigger(next);
  }
  return true;
}


function refreshTriggers() {
  var next = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Scheduled Jobs').getRange(2,1).getValue();
  manageTriggers(next);
}
  

function killTriggers() {
  Logger.log('Start killTriggers');
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log(triggers.length + ' Triggers');
  if (triggers.length < 1) {
    ScriptApp.newTrigger('update').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onChange().create();
    return;
  } else {
    for (i in triggers) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('update').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onChange().create();
  Logger.log('Triggers successfully killed.');
  return;
}

function setTrigger(time) {
  Logger.log('Setting trigger at ' + time);
  var trigger = ScriptApp.newTrigger('doNextTweet').timeBased().at(time).create();
  Logger.log('Trigger set!');
  return;
}

function setUpSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Add Tweets');
  var button = Browser.msgBox('This will clear all scheduled tweets and saved jobs. Are you sure?', Browser.Buttons.OK_CANCEL);
  Logger.log(button);
  if (button == 'ok') {
    sheet.clear();
    sheet.setName('Add Tweets');
    var range = [['Start Date:', '', 'Start Time:', '', 'Interval:', ''],
                 ['Time','Tweet','','','','']];
    sheet.getRange(1,1,range.length,range[0].length).setValues(range);
    var validation = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false); //SpreadsheetApp.DataValidationCriteria.DATE_IS_VALID_DATE;
    sheet.getRange(1,2).setDataValidation(validation);
    sheet.setFrozenRows(2);
    sheet = ss.getSheetByName('Scheduled Jobs');
    sheet.clear();
    sheet.setName('Scheduled Jobs');
    sheet.getRange(1,1,1,3).setValues([['time','tweet','trigger Id']]);
    sheet.setFrozenRows(1);
    killTriggers();
  } else {
    return;
  }
}

function encodeString(q) {
  var str = encodeURIComponent(q);
  str = str.replace(/\'/g, "%27")
             .replace(/\)/g,"%29")
             .replace(/\[/g,"%5B")
             .replace(/\]/g,"%5D")
             .replace(/\!/g,"%21")
             .replace(/\*/g,"%2A")
             .replace(/\(/g,"%28");
  return str;
}

function postTweet(tweet) {
  //testing
  //tweet = 'test.';
  
  try {
    
    var twitterService = getTwitterService().setMethod('post');
    var payload = "status=" + encodeString(tweet);
    var options = {
      "method": "POST",
      "escaping": false,
      "payload": payload
    };
    
    var url = "https://api.twitter.com/1.1/statuses/update.json";
    
    var request = twitterService.fetch(url, options);
    Logger.log('post complete');
    
  }  catch (e) {
    writeError('Error in Post Tweet');
    writeError(e);
    return;
  }
  
  Logger.log(request);
  return request.getResponseCode();
}

function writeError(e) {
  var sheet3 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Errors');
  var range = sheet3.getRange(2,1,sheet3.getLastRow(),sheet3.getLastColumn());
  range.setBackgroundRGB(200,200,200);
  var row = sheet3.insertRowAfter(1);
  var now = new Date();
  sheet3.getRange(2,1).setValue(now);  
  if (e != null) {
    sheet3.getRange(2,2).setValue(e.toString());
  }
}

function doProperty_(key, value) {
  
  var properties = PropertiesService.getScriptProperties();
  
  if (value) {
    properties.setProperty(key, value);
  } else {
    return properties.getProperty(key) || "";
  }
  
}

function appendTweets(hashtag) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Add Tweets');
  var tweets = sheet.getRange(3,2,sheet.getLastRow()-2,1).getValues();
  for (aTi in tweets) {
    var tweet = tweets[aTi][0].toString();
    if (tweet.indexOf(hashtag) < 0) {
      tweet += ' ' + hashtag;
    }
    
    if (tweet.length > 140) {
      tweet = tweets[aTi][0].substring(0, 140 - hashtag.length - 1) + ' ' + hashtag;
    }
    tweets[aTi][0] = tweet;
  }
  sheet.getRange(3,2,sheet.getLastRow()-2,1).setValues(tweets);
  return;
}
