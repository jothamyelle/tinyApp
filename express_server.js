// import the goods (express) and set important variables
var express = require("express");
var app = express(); // store the express app in a variable for convenience
var cookieParser = require('cookie-parser');
var PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

/*****************************************************
* generateRandomString: generates a random string from
* a list of letters and numbers
******************************************************/
function generateRandomString() {
  let output = "";
  let letters = "abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 6; i++) {
    let letterNum = letters.charAt(Math.floor(Math.random() * letters.length));
    output += letterNum;
  }
  return output;
}

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "jotham": {
     id: "jotham", 
     email: "jotham@hotmail.com", 
     password: "seven"
   }
}

// temporary object representing a database
var urlDatabase = {
  "b2xVn2": {
    userID: 'jotham',
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    userID: 'userRandomID',
    shortURL: "9sm5xK",
    longURL: "http://www.google.com"
  }
};

// listening for/handling routes
app.get("/", (req, res) => {
  // root greeting message
  res.end("Hello!");
});

// returns a new login page that asks 
// for an email and password
app.get("/login", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    longURL: urlDatabase[[req.params.id]].longURL,
    user: users[req.cookies["userID"]]
  };
  res.render('login', templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  // passes in the entire object, that contains
  // the whole database object as the key value
  let templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies["userID"]] 
  };
  res.render("urls_index", templateVars);
});

// renders the new url form page
app.get("/urls/new", (req, res) => {
  let user;
  if(req.cookies["userID"] !== undefined) {
    for (checkUser in users) {
      if (users[req.cookies["userID"]].userID === users[checkUser].userID) {
        user = req.cookies["userID"];
      }
    }
  }
  if (!user) {
    res.redirect("/login");
  }
  let templateVars = { 
    user: users[req.cookies["userID"]] 
  };
  res.render("urls_new", templateVars);
});

// renders the page that shows the short and long 
// url according to the short url given in the path
app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies["userID"]]
  };
  res.render("urls_show", templateVars);
});

// take the short url and redirects the user to the long
// url it corresponds to in the database
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  // TODO error check to see if URL contains protocol
  res.statusCode = 301;
  res.redirect(longURL);
});

// returns a page that includes a form with an email 
// and password field
app.get("/register", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: req.cookies["userID"]
  };
  res.render('register', templateVars);
});

// adds a new user object in the global users 
// object which keeps track of the newly 
// registered user's email, password and user ID
app.post("/register", (req, res) => {
  let userID = generateRandomString();
  let user = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };
  if (user.email === "" || user.password === "") {
    res.statusCode = 400;
    res.send(res.statusCode + ": Email or Password field left blank.");
    return;
  }
  for (checkUser in users) {
    if (user.email === users[checkUser].email) {
      res.statusCode = 400;
      res.send(res.statusCode + ": Email already exists.");
      return;
    }
   }
  users[userID] = user;
  res.cookie('userID', userID);
  res.redirect(`http://localhost:8080/urls`);
});

// creates a short URL, adds it to the database
// with the corresponding long url as the value
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let newURLEntry = {
    userID: req.cookies["userID"],
    shortURL: shortURL,
    longURL: req.body.longURL
  };
  urlDatabase[shortURL] = newURLEntry;
  res.statusCode = 303;
  res.redirect(`http://localhost:8080/urls/${shortURL}`);
});

// deletes a url based on the short url entered 
// in the path, then redirects back to the urls page
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`http://localhost:8080/urls`);
});

// updates the long url of the specified short url
app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.cookies["userID"]]) {
    urlDatabase[req.cookies["userID"]][req.params.id] = req.body.longURL;
  }
  res.redirect(`http://localhost:8080/urls`);
});

// links to the update page with the correct short url
app.post("/urls/:id/update", (req, res) => {
  if (urlDatabase[req.params.id].userID === req.cookies["userID"]) {
    res.redirect(`http://localhost:8080/urls/${req.params.id}`);
  } else {
    res.statusCode = 401;
    res.send(res.statusCode + `: You cannot edit a link that you didn't add.  Please return to <a href="/urls">Index Page</a>`);
  }
});

// sets a cookie named 'userid'
app.post("/login", (req, res) => {
  // if the provided email and password match one of the objects in the users object
  let user;
  for (checkUser in users) {
    if (req.body.email === users[checkUser].email) {
      if (req.body.password === users[checkUser].password) {
        user = users[checkUser].id;
        break;
      }
      res.statusCode = 404;
      res.send(res.statusCode + ": Wrong password, homie.  Click <a href='/login'>here</a> to try again.");
    }
  }
  if (user !== undefined) {
    // set the cookie to be equal to that user's id
    res.cookie('userID', user);
  } else {
    res.statusCode = 404;
    res.send(res.statusCode + ": Sorry, dude.  Your login info is not in our database.  Click <a href='/register'>here</a> to register.");
  }
  res.redirect("/urls");
});

// deletes the cookie named 'userID'
app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect("/urls");
});

// creates the server at the given port on the localhost
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});