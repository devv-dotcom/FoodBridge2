const http = require('http');

const data = JSON.stringify({
  email: 'admin@foodbridge.org',
  password: 'AdminPassword123!',
  role: 'admin'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Response Body:', body);
  });
});

req.on('error', error => {
  console.error('HTTP Request Error:', error);
});

req.write(data);
req.end();
