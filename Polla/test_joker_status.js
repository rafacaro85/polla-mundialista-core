
require('dotenv').config({ path: './apps/api/.env' });
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./apps/api/dist/app.module');
const { PredictionsService } = require('./apps/api/dist/predictions/predictions.service');

async function testJoker() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(PredictionsService);

  const userId = '12345678-1234-1234-1234-123456789012'; // Dummy ID, won't matter if it just queries
  
  try {
    console.log('Testing WC2026:');
    const wcStatus = await service.getJokerStatus(userId, 'WC2026', null);
    console.log(wcStatus);
    
    console.log('\nTesting UCL2526:');
    const uclStatus = await service.getJokerStatus(userId, 'UCL2526', null);
    console.log(uclStatus);
  } catch (err) {
    console.error('Error in getJokerStatus:', err);
  }

  await app.close();
}

testJoker();
