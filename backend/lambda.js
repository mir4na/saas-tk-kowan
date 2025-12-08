const serverless = require('serverless-http');
const app = require('./src/server');

// Wrap Express app with serverless-http
module.exports.handler = serverless(app);
