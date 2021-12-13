#!/bin/sh
cd backend;
nodemon server;
cd ../frontend;
npm start
google-chrome-stable http://www.localhost:8081
