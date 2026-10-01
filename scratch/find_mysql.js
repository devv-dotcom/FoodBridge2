const mysql = require('mysql2/promise');

async function findMysql() {
  const ports = [3306, 3307, 3308, 8889];
  const hosts = ['127.0.0.1', 'localhost'];
  const passwords = ['', 'root', '123456', 'admin', 'password'];

  for (const host of hosts) {
    for (const port of ports) {
      for (const password of passwords) {
        try {
          const conn = await mysql.createConnection({ host, port, user: 'root', password, timeout: 2000 });
          console.log(`\n🎉 SUCCESS! Found MySQL server at ${host}:${port} with user 'root' and password '${password}'`);
          const [dbs] = await conn.query('SHOW DATABASES');
          console.log('Available databases:', dbs.map(d => d.Database));
          await conn.end();
          return { host, port, user: 'root', password, databases: dbs.map(d => d.Database) };
        } catch (err) {
          // ignore failures
        }
      }
    }
  }
  console.log('\n❌ No active local MySQL server found on standard ports (3306, 3307, 3308, 8889).');
  return null;
}

findMysql();
