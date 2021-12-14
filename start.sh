#!/bin/sh
kill -9 $(lsof -t -i tcp:3000,8081)
cd backend;
sudo npm install;
sudo npm install -g nodemon;
nodemon server&
cd ../frontend;
sudo npm install --save-dev run-script-os;
npm start&
sleep 5;
xdg-open http://localhost:8081
