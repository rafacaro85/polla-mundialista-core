
require('dotenv').config({ path: './apps/api/.env' });
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./apps/api/dist/app.module');
const { PredictionsService } = require('./apps/api/dist/predictions/predictions.service');

async function testUpsertJoker() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(PredictionsService);

  const userId = '3274-4cd67a23ba9b24ed'; // From frontend logs
  const matchId = '1870-be2545dc9952da85'; // From frontend logs
  const leagueId = '7dd953cf-365a-40d1-b33d-e79530a0e800'; // From frontend logs
  
  try {
    console.log(`Testing upsert prediction with joker for user ${userId} and match ${matchId} in league ${leagueId}`);
    
    const pred = await service.upsertPrediction(
       userId,
       matchId,
       1, // homeScore
       2, // awayScore
       leagueId,
       true // isJoker
    );
    console.log('Success:', pred);
  } catch (err) {
    console.error('Error in upsertPrediction:', err);
  }

  await app.close();
}

testUpsertJoker();
