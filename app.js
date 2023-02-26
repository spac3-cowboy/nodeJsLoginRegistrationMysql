const express = require('express');
const jwt = require('jsonwebtoken');
const bodyparser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(bodyparser.json());

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nodejs"
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
  });

app.post('/register', (req, res) => {
    const {username, password} = req.body;
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    connection.query(sql, [username, password], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({message: 'Internal server error'});
        }

        console.log('username ${username} registered');
        res.json({message: 'User registered'});
    });
});

app.post('/login', (req, res) => {
    const {username, password} = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    connection.query(sql, [username, password], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({message: 'Internal server error, error logging in'});
        }
        if (result.length === 0) {
            return res.status(401).json({message: 'Invalid username or password'});
        }

        const user = result[0];
        const token = jwt.sign({id: user.id}, 'secret', {expiresIn: '1h'});
        res.json({token});
    });
});

function verifyToken(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(401).json({message: 'No token provided'});
    }
    jwt.verify(token, 'secret', (err, decoded) => {
        if (err) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        req.userId = decoded.id;
        next();
    });
}

app.get('/protected', verifyToken, (req, res) => {
    const username= req.body.username;
    const sql = 'SELECT * FROM users WHERE username = ?';
    connection.query(sql, [username], (err, results) =>{
        if (err) {
            console.error(err);
            return res.status(500).json({message: 'error getting user inofrmation'});
        }
        if (results.length === 0) {
            return res.status(401).json({message: 'username was not found'});
        }
        res.json({message: 'Welcome to the protected route, mr ${username}'});
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server listening on port ${port}');
});