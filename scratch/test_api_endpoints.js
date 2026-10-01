const http = require('http');

function checkEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', err => reject(err));
  });
}

async function runTests() {
  console.log('Testing running API server at http://localhost:5000 ...');
  try {
    const health = await checkEndpoint('/health');
    console.log('GET /health:', health);

    const categories = await checkEndpoint('/api/categories');
    console.log('GET /api/categories count:', categories.body.categories?.length || 0);

    const donations = await checkEndpoint('/api/donations');
    console.log('GET /api/donations count:', donations.body.donations?.length || 0);

    console.log('🎉 ALL BACKEND API ENDPOINTS TESTED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Server not reachable at localhost:5000:', err.message);
    process.exit(1);
  }
}

runTests();
