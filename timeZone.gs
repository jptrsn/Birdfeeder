function handleTZ(date) {
  Logger.log('Input date: ' + date);
  
  //date = '11/4/2015 15:45:00';
  
  //Logger.log('Timezone Input: ' + date);
  var userDate = new Date(date);
  //Logger.log('Date object: ' + userDate);
  Logger.log(SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone());
  var userTimezone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  Logger.log('TZ Offset ' + userTimezone);
  var userTZ = parseFloat(Utilities.formatDate(new Date(), SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'X'));
  /*if (userTZ[0] == '+') {
    userTZ = userTZ.substr(1);
  }
  userTZ = parseFloat(userTZ);
  */
  Logger.log('Formatted offset ' + userTZ);
  userDate.setTime(userDate.getTime()-(userTZ*60*60*1000));
  Logger.log('Adjusted Date: ' + userDate + ' GMT');
  return userDate;
}

function reverseTZ(date) {
  //return date;
  
  //date = new Date('11/4/2015 20:00:00');
  
  //Logger.log('Timezone Input: ' + date);
  var userDate = new Date(date);
  //Logger.log('Date object: ' + userDate);
  var userTZ = parseFloat(Utilities.formatDate(new Date(), SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'X'));
  userDate.setTime(userDate.getTime()+(userTZ*60*60*1000));
  Logger.log('Adjusted Date: ' + userDate + ' EDT');
  return userDate;
}
