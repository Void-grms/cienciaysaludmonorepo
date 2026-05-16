const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://lis_app:password@127.0.0.1:5433/lis?schema=public',
});
client.connect()
  .then(() => {
    console.log('Connected successfully');
    return client.end();
  })
  .catch(err => console.error('Connection error', err.stack));
