// let's go!
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// TODO use express middleware to handle cookies (JWT)
// TODO use express middleware to populate current user
console.log(process.env.FRONTEND_URL)
server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL
  }
}, (res) => {
  console.log(`Server running on port ${res.port}`)
})


