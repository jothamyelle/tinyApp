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
    user: req.session.userID,
    session: req.session,
    req: req
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
  console.log(databases.urlDatabase);
  // check if the user is logged in, if they're not, then tell them to login or register
  if (req.session.userID) {
    // passes in the entire object, that contains
    // the whole database object as the key value
    let URLs = functions.urlsForUser(req.session.userID);
    let templateVars = { 
      urls: URLs,
      user: databases.users[req.session.userID],
      session: req.session, 
      req: req
    };
    res.render("urls_index", templateVars);
  } else {
    req.session.errMessage = "You must be logged in to view urls.";
    return res.redirect('/login');
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
    user: user ,
    session: req.session,
    req: req
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
        user: databases.users[req.session.userID],
        session: req.session,
        req: req
      };
      res.render("urls_show", templateVars);
    } else {
      req.session.errMessage = "You don't have access to view this url.";
      return res.redirect('/urls');
      // res.statusCode = 401;
      // res.send(res.statusCode + ": You don't have access to view this url. Return to <a href='/urls'>Home</a>.");
    }
  } else {
    req.session.errMessage = "You must be logged in to view urls.";
    return res.redirect('/login');
  }
});

// take the short url and redirects the user to the long
// url it corresponds to in the database
router.get("/u/:shortURL", (req, res) => {
  if (databases.urlDatabase[req.params.shortURL]) {
    let longURL = databases.urlDatabase[req.params.shortURL].longURL;
    if (!longURL.includes("http://")) {
      if (!longURL.includes("www.")) {
        let newURL = `http://www.${longURL}`;
        res.statusCode = 301;
        databases.urlDatabase[req.params.shortURL].numVisits++;
        console.log("databases.urlDatabase[req.params.shortURL].uniqueVisits: ",databases.urlDatabase[req.params.shortURL].uniqueVisits);
        if (databases.urlDatabase[req.params.shortURL].uniqueVisits.indexOf(req.session.userID) === -1) {
          databases.urlDatabase[req.params.shortURL].uniqueVisits.push(req.session.userID);
        }
        res.redirect(newURL);
      } else {
        let newURL = `http://${longURL}`;
        res.statusCode = 301;
        if (databases.urlDatabase[req.params.shortURL].uniqueVisits.indexOf(req.session.userID) === -1) {
          databases.urlDatabase[req.params.shortURL].uniqueVisits.push(req.session.userID);
        }
        databases.urlDatabase[req.params.shortURL].numVisits++;
        res.redirect(newURL);
      }
    } else {
      res.statusCode = 301;
      if (databases.urlDatabase[req.params.shortURL].uniqueVisits.indexOf(req.session.userID) === -1) {
        databases.urlDatabase[req.params.shortURL].uniqueVisits.push(req.session.userID);
      }
      databases.urlDatabase[req.params.shortURL].numVisits++;
      res.redirect(longURL);
    }
  } else {
    req.session.errMessage = "That URL doesn't exist in our records.";
    return res.redirect('/urls');
  }
});

// returns a page that includes a form with an email 
// and password field
router.get("/register", (req, res) => {
  if (!databases.users[req.session.userID]) {
    let templateVars = { 
      user: databases.users[req.session.userID],
      session: req.session,
      req: req
    };
    res.render('register', templateVars);
  } else {
    return res.redirect('/urls');
  }
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
  if (req.body.email === "" || req.body.password === "") {
    req.session.errMessage = "Email or Password field left blank. Please complete both fields.";
    return res.redirect('/register');
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
  req.session.userID = userID;
  res.redirect(`http://localhost:8080/urls`);
});

// creates a short URL, adds it to the database
// with the corresponding long url as the value
router.post("/urls", (req, res) => {
  let shortURL = functions.generateRandomString();
  let newURLEntry = {
    userID: req.session.userID,
    shortURL: shortURL,
    longURL: req.body.longURL,
    dateCreated: new Date().toLocaleDateString("en-US"),
    numVisits: 0,
    uniqueVisits: []
  };
  databases.urlDatabase[shortURL] = newURLEntry;
  res.statusCode = 303;
  res.redirect(`http://localhost:8080/urls/${shortURL}`);
});

// deletes a url based on the short url entered 
// in the path, then redirects back to the urls page
router.post("/urls/:id/delete", (req, res) => {
  if (databases.urlDatabase[req.session.userID]) {
    delete databases.urlDatabase[req.params.id];
    res.redirect(`http://localhost:8080/urls`);
  } else {
    req.session.errMessage = "You don't have permission do delete this URL. You either don't have permission or your session has timed out";
    return res.redirect('/login');
  }
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
    req.session.errMessage = "You cannot edit a link that you didn't add.";
    return res.redirect('/urls');
  }
});

router.post("/login", (req, res, next) => {
  // if the provided email and password match one of the objects in the users object
  let user;
  for (checkUser in databases.users) {
    if (req.body.email === databases.users[checkUser].email) {
      if (bcrypt.compareSync(req.body.password, databases.users[checkUser].password)) {
        user = databases.users[checkUser].id;
        break;
      }
      req.session.errMessage = "You've entered incorrect login information.  Please try again.";
      return res.redirect('/login');
    }
  }
  if (user !== undefined) {
    // set the cookie to be equal to that user's id
    req.session.userID = user;
  } else {
    res.statusCode = 404;
    res.send(res.statusCode + ": Sorry, dude.  Your login info is not in our database.  Click <a href='/register'>here</a> to register.");
  }
  res.redirect("/urls");
});

// deletes the cookie named 'userID'
router.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

module.exports = router;