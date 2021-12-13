#!/bin/sh
kill -9 $(lsof -t -i tcp:3000,8081)
cd backend;
npm install;
nodemon server&
cd ../frontend;
npm install;
npm start&
xdg-open http://localhost:8081
