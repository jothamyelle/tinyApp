# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs.  It's basically the best URL shortener you'll ever use in your life.  Don't try to fight it.

## Final Product

!["Login Page"](/screenshots/1.png?raw=true "TinyApp Screenshot)
!["URL Home Page"](/screenshots/2.png?raw=true "TinyApp Screenshot)
!["URL Visitor Info"](/screenshots/3.png?raw=true "TinyApp Screenshot)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

## Features

- Header displays app name and login/register options depending on user info
- ability to view your own shortened URLs
- includes analytics for URL requests (number of unique users, number of views, date requested)
- ability to edit/delete urls with user permission
- secure login