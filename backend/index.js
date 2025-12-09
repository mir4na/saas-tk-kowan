const serverless = require('serverless-http');
const app = require('./src/server');

module.exports.handler = serverless(app, {
  binary: false,
  request: (request, event, context) => {
    // Ensure proper body parsing from API Gateway
    if (event.body && typeof event.body === 'string') {
      try {
        request.body = JSON.parse(event.body);
      } catch (e) {
        request.body = event.body;
      }
    }
  }
});