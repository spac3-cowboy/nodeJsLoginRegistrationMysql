const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const app = express();

// User Model
const users = [
  {
    id: '1',
    username: 'user1',
    password: 'password1'
  },
  {
    id: '2',
    username: 'user2',
    password: 'password2'
  }
];

// Body Parser Middleware
app.use(bodyParser.json());

// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username && user.password === password);
  
  //remove the !user functionality in the production code
  
  if (!user) {
    return res.status(401).send('Invalid username or password');
  }
  
  // Generate a random token
  const token = uuid.v4();
  user.token = token;
  
  // Return the token
  res.send(token);
  console.log(token);
});

// Authentication Middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization');

  //console log if any token is passed
    console.log(token);

    //remove the Bearer word from the token
    const token1 = token.split(' ')[1];
    console.log(token1);
  
  if (!token1) {
    return res.status(401).send('No token provided');
  }
  
  const user = users.find(user => user.token === token1);

  if (!user) {
    return res.status(401).send('Invalid token');
  }
  
  // Check if token has expired
  if (Date.now() - user.token1CreatedAt > 1000 * 60 * 60) { // 1 hour
    return res.status(401).send('Token has expired');
  }
  
  req.user = user;
  next();
};

// Protected Route
app.get('/protected', auth, (req, res) => {
  res.send(`Hello, ${req.user.username}!`);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
