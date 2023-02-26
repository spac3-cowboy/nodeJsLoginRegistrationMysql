const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const secret = 'mysecret'; // secret key

const user = [
    {
        id: 1, username: 'user1', password: 'password1'},
    {
        id: 2, username: 'user2', password: 'password2'},
];

function generateToken(user){
    const token = jwt.sign({sub: user.id, username: user.username}, secret, {expiresIn: '3h'});
    return token;
}

function verifyToken(token){
    try{
        const decoded = jwt.verify(token, secret);
        return decoded;
    }catch(err){
        return null;
    }
}

function hashPassword(password){
    const slat = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, slat, 1000, 64, 'sha512').toString('hex'); // 1000 iterations, 64 length
    return {slat, hash};
}

function verifyPassword(password, slat, hash){
    const hashVerify = crypto.pbkdf2Sync(password, slat, 1000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}

const server = http.createServer((req, res) => {
    const { url, method } = req;
  
    if (method === 'POST' && url === '/login') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const {username, password} = JSON.parse(body);
            const userFound = user.find(u => u.username === username);
            if(userFound){
                const {slat, hash} = hashPassword(password);
                const token = generateToken(userFound);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({token}));
            }else{
                res.writeHead(404, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'User not found'}));
            }
        });
    }else if(method === 'GET' && url === '/user'){
        const token = req.headers['x-access-token'];
        const user = verifyToken(token);
        if(user){
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(user));
        }else{
            res.writeHead(401, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({message: 'Unauthorized'}));
        }
    }else{
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'Not found'}));
    }
    });
  
  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
  });