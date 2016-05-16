
const fs = require('fs');
const path = require('path');

const express = require('express');
const app = express();

const port = 3000;

app.get('/', (req, res) => {
  res.sendFile( path.join(__dirname, 'app' , '.build', 'index.html') );
});

app.get('/third_party/require.js', (req, res) => {
  res.sendFile( path.join(__dirname, 'node_modules' , 'requirejs', 'require.js') );
});

app.get('/client.js', (req, res) => {
  res.sendFile( path.join(__dirname, 'client.js') );
});

app.get('/bundle.js', (req, res) => {
  res.sendFile( path.join(__dirname, 'app' , '.build', 'bundle.js') );
});

app.use('/', express.static(path.join(__dirname, 'app' , '.build')));

app.listen(port);
console.log("Server listening on " + port);
