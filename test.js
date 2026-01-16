const http = require('http');
const fs = require('fs');

const app = http.createServer((request, response) => {
  response.writeHead(200);
  response.end('Hello?');
});
app.listen(3000);