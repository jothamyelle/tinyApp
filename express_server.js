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

// temporary object representing a database
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// listening for/handling routes
app.get("/", (req, res) => {
  // root greeting message
  res.end("Hello!");
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
    username: req.cookies["username"] 
  };
  res.render("urls_index", templateVars);
});

// renders the new url form page
app.get("/urls/new", (req, res) => {
  let templateVars = { 
    username: req.cookies["username"] 
  };
  res.render("urls_new", templateVars);
});

// renders the page that shows the short and long 
// url according to the short url given in the path
app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    longURL: urlDatabase[[req.params.id]],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

// take the short url and redirects the user to the long
// url it corresponds to in the database
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  // TODO error check to see if URL contains protocol
  res.statusCode = 301;
  res.redirect(longURL);
});

// creates a short URL, adds it to the database
// with the corresponding long url as the value
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
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
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`http://localhost:8080/urls`);
});

// links to the update page with the correct short url
app.post("/urls/:id/update", (req, res) => {
  res.redirect(`http://localhost:8080/urls/${req.params.id}`);
});

// sets a cookie named 'username'
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

// deletes the cookie named 'username'
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

// creates the server at the given port on the localhost
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});