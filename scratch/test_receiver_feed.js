const http = require('http');

function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:5000${path}`, res => {
      console.log(`[HTTP Test] GET ${path} => Status ${res.statusCode}`);
      resolve(res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 401);
    }).on('error', err => {
      console.error(`[HTTP Test Error] ${path}:`, err.message);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('Testing Food Receiver Platform Endpoints...');
  await checkEndpoint('/dashboard.html');
  await checkEndpoint('/ngo/dashboard.html');
  await checkEndpoint('/volunteer/dashboard.html');
  console.log('Verification Complete!');
}

runTests();
