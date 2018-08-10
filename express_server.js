// import the goods (express) and set important variables
var express = require("express");
var app = express();
var cookieSession = require('cookie-session');
var PORT = 8080;
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
// TODO - Make this routes thing work...
const routes = require("./views/routes");

app.use(cookieSession({
  name: 'session',
  keys: ["enfluenza","magicallydelicious","jamiehasabeard"],
  maxAge: 24 * 60 * 60 * 1000
}))

app.use('/', routes);

// creates the server at the given port on the localhost
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});