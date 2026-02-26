import { Client } from 'pg';

async function updateRole(connectionString: string, name: string) {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`Connected to ${name}...`);
    
    // Check if user exists
    const checkRes = await client.query('SELECT id, email, role FROM users WHERE email = $1', ['racv85@gmail.com']);
    
    if (checkRes.rows.length === 0) {
      console.log(`User racv85@gmail.com not found in ${name}.`);
      return;
    }
    
    console.log(`Found user in ${name}:`, checkRes.rows[0]);
    
    // Update role
    const updateRes = await client.query('UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, role', ['SUPER_ADMIN', 'racv85@gmail.com']);
    
    console.log('✅ Update successful. New data:', updateRes.rows[0]);
  } catch (err) {
    console.log(`Error in ${name}:`, err.message);
  } finally {
    await client.end();
  }
}

async function run() {
  const urls = [
    { name: 'shortline', url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway' },
    { name: 'yamabiko', url: 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway' }
  ];

  for (const db of urls) {
    console.log(`\n--- Trying ${db.name} ---`);
    await updateRole(db.url, db.name);
  }
}

run();
