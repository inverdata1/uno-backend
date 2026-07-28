const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:admin1206@localhost:5432/uno_delivery?schema=public'
});
client.connect()
  .then(() => client.query('SELECT "taggedProducts" FROM "Post" WHERE "taggedProducts" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 1'))
  .then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
