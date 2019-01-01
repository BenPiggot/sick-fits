// let's go!
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

server.express.use(cookieParser());

server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put userId on to the request
    req.userId = userId;
  }
  next();
});

// create middleware that populates the user on each request
server.express.use(async (req, res, next) => {
  if(!req.userId) {
    return next();
  }
  const user = await db.query.user(
    { where: { id: req.userId }}, 
    '{ id, permissions, email, name }'
  )
  req.user = user;
  next();
})

server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL
  }
}, (res) => {
  console.log(`Server running on port ${res.port}`)
})


