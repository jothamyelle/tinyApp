const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const functions = require('./functions/functions');
const databases = require('./databases');

router.get("/", (req, res) => {
  if(req.session.userID){
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

/* LOGIN */ 
//GET
router.get("/login", (req, res) => {
  let templateVars = { 
    user: req.session.userID,
    session: req.session,
    req: req
  };
  res.render('login', templateVars);
});
// POST
router.post("/login", (req, res, next) => {
  let user;
  for (checkUser in databases.users) {
    let userToCheckAgainst = databases.users[checkUser];
    if (req.body.email === userToCheckAgainst.email) {
      if (bcrypt.compareSync(req.body.password, userToCheckAgainst.password)) {
        user = userToCheckAgainst.id;
        break;
      }
      req.session.errMessage = "You've entered incorrect login information.  Please try again.";
      return res.redirect('/login');
    }
  }
  if (user !== undefined) {
    req.session.userID = user;
  } else {
    req.session.errMessage = "Sorry, dude.  Your login info is not in our database.";
    return res.redirect('/register');
  }
  res.redirect("/urls");
});

/* LOGOUT */
router.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

/* URLS HOMEPAGE */
// GET
router.get("/urls", (req, res) => {
  // check if the user is logged in, if they're not, then tell them to login or register
  let userID = req.session.userID;
  if (userID) {
    let URLs = functions.urlsForUser(userID);
    let templateVars = { 
      urls: URLs,
      user: databases.users[userID],
      session: req.session, 
      req: req
    };
    res.render("urls_index", templateVars);
  } else {
    req.session.errMessage = "You must be logged in to view urls.";
    return res.redirect('/login');
  }
});
// POST
router.post("/urls", (req, res) => {
  let shortURL = functions.generateRandomString();
  let newURLEntry = {
    userID: req.session.userID,
    shortURL: shortURL,
    longURL: req.body.longURL,
    dateCreated: new Date().toLocaleDateString("en-US"),
    numVisits: 0,
    uniqueVisits: [],
    timestamp: Math.floor(Date.now() / 1000),
    visitors: []
  };
  databases.urlDatabase[shortURL] = newURLEntry;
  res.statusCode = 303;
  res.redirect(`http://localhost:8080/urls/${shortURL}`);
});

/* SHORTENED URLS */
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

/* URLS EDIT PAGE */
// GET
router.get("/urls/:id", (req, res) => {
  if (req.session.userID) {
    let URLs = functions.urlsForUser(req.session.userID);
    let userCanViewURLs = false;
    for (url in URLs) {
      if (URLs[url].shortURL === req.params.id) {
        userCanViewURLs = true;
      }
    }
    if (userCanViewURLs) {
      let templateVars = { 
        URLDB: databases.urlDatabase,
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
    }
  } else {
    req.session.errMessage = "You must be logged in to view urls.";
    return res.redirect('/login');
  }
});
// POST
router.post("/urls/:id", (req, res) => {
  let urlUserId = databases.urlDatabase[req.params.id].userID;
  if (urlUserId === req.session.userID) {
    res.redirect(`http://localhost:8080/urls/${req.params.id}`);
  } else {
    req.session.errMessage = "You cannot edit a link that you didn't add.";
    return res.redirect('/urls');
  }
});
// PUT
router.put("/urls/:id", (req, res) => {
  let updatableURL = databases.urlDatabase[req.params.id];
  if (updatableURL) {
    updatableURL.longURL = req.body.longURL;
  }
  res.redirect(`http://localhost:8080/urls`);
});
// DELETE
router.delete("/urls/:id", (req, res) => {
  let urlToDelete = databases.urlDatabase[req.params.id];
  if (urlToDelete.userID == req.session.userID) {
    delete databases.urlDatabase[req.params.id];
    res.redirect(`http://localhost:8080/urls`);
  } else {
    req.session.errMessage = "You don't have permission do delete this URL. You either don't have permission or your session has timed out";
    return res.redirect('/login');
  }
});
/* DELETE ERROR MESSAGE */
router.delete("/error/:id", (req, res) => {
    delete req.session.errMessage;
    return res.redirect(`http://localhost:8080/${req.params.id}`);
});

/* SHORT URL REDIRECT  & VISITOR INFO UPDATE*/
router.get("/u/:shortURL", (req, res) => {
  let newVisitor = {
    visitorID: functions.generateRandomString(),
    timestamp: new Date()
  };
  let userID = req.session.userID;
  let shortURL = databases.urlDatabase[req.params.shortURL];
  if (shortURL) {
    let uniqueVisitor = shortURL.uniqueVisits.indexOf(userID) === -1;
    let longURL = shortURL.longURL;
    if (!longURL.includes("http://")) {
      if (!longURL.includes("www.")) {
        let newURL = `http://www.${longURL}`;
        res.statusCode = 301;
        shortURL.numVisits++;
        shortURL.visitors.push(newVisitor);
        if (uniqueVisitor) {
          shortURL.uniqueVisits.push(userID);
        }
        res.redirect(newURL);
      } else {
        let newURL = `http://${longURL}`;
        res.statusCode = 301;
        if (uniqueVisitor) {
          shortURL.uniqueVisits.push(userID);
        }
        shortURL.visitors.push(newVisitor);
        shortURL.numVisits++;
        res.redirect(newURL);
      }
    } else {
      res.statusCode = 301;
      if (uniqueVisitor) {
        shortURL.uniqueVisits.push(userID);
      }
      shortURL.visitors.push(newVisitor);
      shortURL.numVisits++;
      res.redirect(longURL);
    }
  } else {
    req.session.errMessage = "That URL doesn't exist in our records.";
    return res.redirect('/urls');
  }
});

/* REGISTER PAGE */
// GET
router.get("/register", (req, res) => {
  let newUser = !databases.users[req.session.userID];
  if (newUser) {
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
// POST
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
      req.session.errMessage = "Email already exists.";
      return res.redirect('/register');
    }
   }
   databases.users[userID] = user;
  req.session.userID = userID;
  res.redirect(`http://localhost:8080/urls`);
});

module.exports = router;