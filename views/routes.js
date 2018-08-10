const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const functions = require('./functions/functions');
const databases = require('./databases');

// listening for/handling routes
router.get("/", (req, res) => {
  if(req.session.userID){
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// returns a new login page that asks 
// for an email and password
router.get("/login", (req, res) => {
  let templateVars = { 
    session: databases.users[req.session.userID]
  };
  res.render('login', templateVars);
});

router.get("/urls.json", (req, res) => {
  res.json(databases.urlDatabase);
});

router.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

router.get("/urls", (req, res) => {
  // check if the user is logged in, if they're not, then tell them to login or register
  if (req.session.userID) {
    // passes in the entire object, that contains
    // the whole database object as the key value
    let URLs = functions.urlsForUser(req.session.userID);
    let templateVars = { 
      urls: URLs,
      session: databases.users[req.session.userID] 
    };
    res.render("urls_index", templateVars);
  } else {
    res.statusCode = 401;
    res.send(res.statusCode + ": You must be logged in to view urls.  Please <a href='/login'>Login</a> or <a href='/register'>Register</a>.");
  }
});

// renders the new url form page
router.get("/urls/new", (req, res) => {
  let user;
  if(req.session.userID !== undefined) {
    for (checkUser in databases.users) {
      if (req.session.userID === databases.users[checkUser].id) {
        user = databases.users[req.session.userID];
      }
    }
  }
  if (!user) {
    res.redirect("/login");
  }
  let templateVars = { 
    session: user 
  };
  res.render("urls_new", templateVars);
});

// renders the page that shows the short and long 
// url according to the short url given in the path
router.get("/urls/:id", (req, res) => {
  // if a user is logged in
  if (req.session.userID) {
    let URLs = functions.urlsForUser(req.session.userID);

    // if the object of the id-specific url objects contains 
    // the current user's id, show them the url
    let userCanViewURLs = false;
    // loop through each url for the logged in user
    for (url in URLs) {
      // if the short URL requested is within their list of URLs
      // then they can have access to view the urls
      if (URLs[url].shortURL === req.params.id) {
        userCanViewURLs = true;
      }
    }
    if (userCanViewURLs) {
      let templateVars = { 
        shortURL: req.params.id,
        longURL: databases.urlDatabase[req.params.id].longURL,
        session: databases.users[req.session.userID]
      };
      res.render("urls_show", templateVars);
    } else {
      res.statusCode = 401;
      res.send(res.statusCode + ": You don't have access to view this url. Return to <a href='/urls'>Home</a>.");
    }
  } else {
    res.statusCode = 401;
    res.send(res.statusCode + ": You must be logged in to view urls.  Please <a href='/login'>Login</a> or <a href='/register'>Register</a>.");
  }
});

// take the short url and redirects the user to the long
// url it corresponds to in the database
router.get("/u/:shortURL", (req, res) => {
  let longURL = databases.urlDatabase[req.params.shortURL].longURL;
  // TODO error check to see if URL contains protocol
  res.statusCode = 301;
  res.redirect(longURL);
});

// returns a page that includes a form with an email 
// and password field
router.get("/register", (req, res) => {
  let templateVars = { 
    session: databases.users[req.session.userID]
  };
  res.render('register', templateVars);
});

// adds a new user object in the global users 
// object which keeps track of the newly 
// registered user's email, password and user ID
router.post("/register", (req, res) => {
  let userID = functions.generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  let user = {
    id: userID,
    email: req.body.email,
    password: hashedPassword
  };
  if (user.email === "" || user.password === "") {
    res.statusCode = 400;
    res.send(res.statusCode + ": Email or Password field left blank.");
    return;
  }
  for (checkUser in databases.users) {
    if (user.email === databases.users[checkUser].email) {
      res.statusCode = 400;
      res.send(res.statusCode + ": Email already exists.");
      return;
    }
   }
   databases.users[userID] = user;
  // res.cookie('session', userID);
    req.session.userID = user;
  res.redirect(`http://localhost:8080/urls`);
});

// creates a short URL, adds it to the database
// with the corresponding long url as the value
router.post("/urls", (req, res) => {
  let shortURL = functions.generateRandomString();
  let newURLEntry = {
    // TODO fix this being undefined
    userID: req.session.userID,
    shortURL: shortURL,
    longURL: req.body.longURL
  };
  databases.urlDatabase[shortURL] = newURLEntry;
  res.statusCode = 303;
  res.redirect(`http://localhost:8080/urls/${shortURL}`);
});

// deletes a url based on the short url entered 
// in the path, then redirects back to the urls page
router.post("/urls/:id/delete", (req, res) => {
  delete databases.urlDatabase[req.params.id];
  res.redirect(`http://localhost:8080/urls`);
});

// updates the long url of the specified short url
router.post("/urls/:id", (req, res) => {
  if (databases.urlDatabase[req.params.id]) {
    databases.urlDatabase[req.params.id].longURL = req.body.longURL;
  }
  res.redirect(`http://localhost:8080/urls`);
});

// links to the update page with the correct short url
router.post("/urls/:id/update", (req, res) => {
  if (databases.urlDatabase[req.params.id].userID === req.session.userID) {
    res.redirect(`http://localhost:8080/urls/${req.params.id}`);
  } else {
    res.statusCode = 401;
    res.send(res.statusCode + `: You cannot edit a link that you didn't add.  Please return to <a href="/urls">Index Page</a>`);
  }
});

// sets a cookie named 'userid'
router.post("/login", (req, res) => {
  // if the provided email and password match one of the objects in the users object
  let user;
  for (checkUser in databases.users) {
    if (req.body.email === databases.users[checkUser].email) {
      if (bcrypt.compareSync(req.body.password, databases.users[checkUser].password)) {
        user = databases.users[checkUser].id;
        break;
      }
      res.statusCode = 400;
      res.send(res.statusCode + ": Wrong password, homie.  Click <a href='/login'>here</a> to try again.");
    }
  }
  if (user !== undefined) {
    // set the cookie to be equal to that user's id
    req.session.userID = user;
    // res.cookie('userID', userID)
  } else {
    res.statusCode = 404;
    res.send(res.statusCode + ": Sorry, dude.  Your login info is not in our database.  Click <a href='/register'>here</a> to register.");
  }
  res.redirect("/urls");
});

// deletes the cookie named 'userID'
router.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie('userID');
  res.redirect("/urls");
});

module.exports = router;