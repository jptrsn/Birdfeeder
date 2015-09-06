// populate Tweets with data from a stored job
function storeJob(jobName, interval) {
  // testing
  //jobName = 'Job 1';
  //interval = 10;
  
  // begin code
  
  jobName = jobName.split(' ').join('_');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Saved Jobs')) {
    return false;
  }
  var sheet = ss.getSheetByName('Add Tweets');
  var jobArray = sheet.getRange(3,2,sheet.getLastRow()-2,1).getValues();
  jobArray.unshift([interval]);
  jobArray.unshift([jobName]);
  var saveSheet = ss.getSheetByName('Saved Jobs');
  if (PropertiesService.getUserProperties().getProperty('storedJobs') != 'true') {
    saveSheet.getRange(1,1,jobArray.length,1).setValues(jobArray);
    PropertiesService.getUserProperties().setProperty('storedJobs', true);
    return true;
  }
  
  var previousJobs = saveSheet.getRange(1,1,1,saveSheet.getLastColumn()).getValues();
  if (previousJobs[0].indexOf(jobName) < 0) {
    var indexCol = saveSheet.getLastColumn()+1;
  } else {
    var indexCol = previousJobs[0].indexOf(jobName)+1;
    saveSheet.getRange(1,indexCol,saveSheet.getLastRow(),1).clear();
  }
  saveSheet.getRange(1,indexCol,jobArray.length,1).setValues(jobArray);
  
  PropertiesService.getUserProperties().setProperty('storedJobs', true);
  return true;
}

function getListItems(){
  var jobsStored = PropertiesService.getUserProperties().getProperty('storedJobs');
  Logger.log(jobsStored);
  if (jobsStored != 'true') {
    return ['No stored jobs'];
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var jobSheet = ss.getSheetByName('Saved Jobs');
  var jobRange = jobSheet.getRange(1,1,jobSheet.getLastRow(),jobSheet.getLastColumn()).getValues();
  var jobNames = [];
  for (gLIi in jobRange[0]) {
    jobNames.push(jobRange[0][gLIi]);
  }
  return jobNames;
}

function retrieveJob(jobName) {
  // testing
  //jobName = 'Job 5';
  
  // begin code
  Logger.log(jobName);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var jobSheet = ss.getSheetByName('Saved Jobs');
  var jobRange = jobSheet.getRange(1,1,jobSheet.getLastRow(),jobSheet.getLastColumn()).getValues();
  var storedTweets = [];
  if (jobRange[0].indexOf(jobName) > -1) {
    var colIndex = jobRange[0].indexOf(jobName);
    for (sJi = 1; sJi < jobRange.length; sJi++) {
      storedTweets.push([jobRange[sJi][colIndex]]);
    }
  } else {
    return false;
  }
  
  var TweetsSheet = ss.getSheetByName('Add Tweets');
  TweetsSheet.getRange(3,1,TweetsSheet.getLastRow(),2).clear();
  TweetsSheet.getRange(1,6).setValue(storedTweets.shift());
  TweetsSheet.getRange(3,2,storedTweets.length,1).setValues(storedTweets);
  return true;
}

function getStoredJobProperty() {
  if (PropertiesService.getUserProperties().getProperty('storedJobs') == 'true') {
    return true;
  } else {
    return false;
  }
}
