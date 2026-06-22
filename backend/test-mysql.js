const mysql = require('mysql2/promise');

const passwords = [
  'IpKslmIUqx',
  'IpKslmlUqx',
  'lpKslmlUqx',
  'IpKsImIUqx',
  'lpKsImIUqx',
  'lpKsImlUqx',
  '1pKslmlUqx',
  'IpKs1m1Uqx',
  '1pKslm1Uqx',
  '1pKs1mIUqx',
  'IpKslm1Uqx',
  'lpKslmIUqx',
  'IpKsImlUqx'
];

async function test() {
  for (const pwd of passwords) {
    try {
      const connection = await mysql.createConnection({
        host: 'sql7.freesqldatabase.com',
        user: 'sql7831159',
        password: pwd,
        database: 'sql7831159'
      });
      console.log('SUCCESS with password:', pwd);
      await connection.end();
      return;
    } catch (err) {
      console.log('Failed:', pwd, err.message);
    }
  }
  console.log('All failed');
}

test();
