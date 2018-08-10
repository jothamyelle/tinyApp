var databases = {};

databases.users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "$2b$10$5Gdh66AvOwf8bWbcSsG8A.20v91bloM/kxOnbEcoMP.K/o9AAFWdq"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "$2b$10$ie.95kMj5gTtWZurYuZ8reVOTMWp6j9ZQLSygnz5y4eQ5y3/wxInK"
  },
  "jotham": {
     id: "jotham", 
     email: "jotham@hotmail.com", 
     password: "$2b$10$nGbBVhnHpGpQWoYWQJAJF.Di3f80qIBykqn.xtpmkyVI0Xir9bcrq"
   }
}

// temporary object representing a database
databases.urlDatabase = {
  "b2xVn2": {
    userID: 'jotham',
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    dateCreated: new Date().toLocaleDateString("en-US"),
    numVisits: 0,
    uniqueVisits: []
  },
  "9sm5xK": {
    userID: 'userRandomID',
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    dateCreated: new Date().toLocaleDateString("en-US"),
    numVisits: 0,
    uniqueVisits: []
  }
};

module.exports = databases;