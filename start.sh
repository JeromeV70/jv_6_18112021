#!/bin/sh
kill -9 $(lsof -t -i tcp:3000,8081)
cd backend;
sudo npm install;
nodemon server&
cd ../frontend;
sudo npm install;
npm start&
sleep 5;
xdg-open http://localhost:8081
