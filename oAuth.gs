// oAuth1 Library used, since oAuthConfig is deprecated.
// Library project key Mb2Vpd5nfD3Pz-_a-39Q4VfxhMjh3Sh48 
// The MIT License (MIT)
//
// Copyright (c) 2014 Ddo
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

function getTwitterService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return OAuth1.createService('twitter')
      // Set the endpoint URLs.
      .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
      .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
      .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')

      // Set the consumer key and secret.
      .setConsumerKey(CONSUMER_KEY)
      .setConsumerSecret(CONSUMER_SECRET)

      // Set the project key of the script using this library.
      .setProjectKey(PROJECT_KEY)
  
      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}

function authCallback(request) {
  var twitterService = getTwitterService();
  var isAuthorized = twitterService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}


function getCredentials() {
  var twitterService = getTwitterService();
  var response = twitterService.fetch('https://api.twitter.com/1.1/account/verify_credentials.json?include_entities=false&skip_status=1');
  var parsed = JSON.parse(response);
  return parsed.name;
  
}

function getTimeline() {
  var twitterService = getTwitterService();
  var response = twitterService.fetch('https://api.twitter.com/1.1/statuses/user_timeline.json');
  Logger.log(response);
}

function getUserInfo() {
  var twitterService = getTwitterService();
  var response = twitterService.fetch('https://api.twitter.com/1.1/account/verify_credentials.json');
  var info = JSON.parse(response);
  Logger.log(response);
  return info;
}

function clearService(){
  OAuth1.createService('twitter')
      .setPropertyStore(PropertiesService.getUserProperties())
      .reset();
}
