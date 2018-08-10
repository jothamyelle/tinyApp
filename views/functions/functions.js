const databases = require('../databases');
var functions = {};

/*****************************************************
* generateRandomString: generates a random string from
* a list of letters and numbers
******************************************************/
functions.generateRandomString = function generateRandomString() {
  let output = "";
  let letters = "abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 6; i++) {
    let letterNum = letters.charAt(Math.floor(Math.random() * letters.length));
    output += letterNum;
  }
  return output;
}

functions.urlsForUser = function urlsForUser(id) {
  let URLs = {};
  for (url in databases.urlDatabase) {
    if (databases.urlDatabase[url].userID === id) {
      URLs[url] = databases.urlDatabase[url];
    }
  }
  return URLs;
}

module.exports = functions;