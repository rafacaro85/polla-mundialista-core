import { DataSource } from 'typeorm';

const NEW_DB_URL =
  'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway';

async function testConnection() {
  console.log('🧪 Testing DB Connection...');
  console.log('URL:', NEW_DB_URL);

  const ds = new DataSource({
    type: 'postgres',
    url: NEW_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await ds.initialize();
    console.log('✅ Connection Successful!');
    await ds.destroy();
  } catch (err) {
    console.error('❌ Connection Failed:', err);
  }
}

testConnection();
