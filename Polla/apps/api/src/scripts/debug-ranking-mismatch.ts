
import { AppDataSource } from '../data-source';
import { User } from '../database/entities/user.entity';
import { Prediction } from '../database/entities/prediction.entity';

async function bootstrap() {
  try {
      console.log('🔌 Connecting to database...');
      await AppDataSource.initialize();
      console.log('✅ Database connected!');

      const userRepo = AppDataSource.getRepository(User);
      const predictionRepo = AppDataSource.getRepository(Prediction);

      const manualEmail = 'racv85@gmail.com';
      console.log(`🔍 Checking predictions for user: ${manualEmail}`);

      const user = await userRepo.findOne({ where: { email: manualEmail } });
      if (!user) {
        console.error('❌ User not found!');
        await AppDataSource.destroy();
        return;
      }

      console.log(`✅ User found: ${user.fullName} (${user.id})`);

      // Fetch all predictions for this user
      const predictions = await predictionRepo.find({
        where: { user: { id: user.id } },
        relations: ['match'],
      });

      console.log(`📊 Total predictions found: ${predictions.length}`);

      // Group by Match ID
      const matchesMap = new Map<string, Prediction[]>();
      predictions.forEach(p => {
        if (!matchesMap.has(p.match.id)) {
            matchesMap.set(p.match.id, []);
        }
        matchesMap.get(p.match.id).push(p);
      });

      let discrepanciesFound = false;
      let pointMismatchesFound = false;

      console.log('\n--- DISCREPANCY ANALYSIS ---');
      
      for (const [matchId, preds] of matchesMap.entries()) {
        if (preds.length <= 1) continue; // Only interested if multiple contexts exist

        // Compare predictions for the same match
        const first = preds[0];
        const hasDiff = preds.some(p => 
            p.homeScore !== first.homeScore || 
            p.awayScore !== first.awayScore
        );

        if (hasDiff) {
            discrepanciesFound = true;
            const matchTitle = `${first.match.homeTeam} vs ${first.match.awayTeam}`;
            console.log(`\n⚠️  SCORE MISMATCH: ${matchTitle} (ID: ${matchId})`);
            
            preds.forEach(p => {
                const context = p.leagueId ? `League ${p.leagueId}` : 'GLOBAL';
                console.log(`   - Context: ${context.padEnd(40)} | Pred: ${p.homeScore}-${p.awayScore} | Points: ${p.points} | Joker: ${p.isJoker}`);
            });
        } else {
             // Check if points differ despite same score
             const hasPointDiff = preds.some(p => p.points !== first.points);
             if (hasPointDiff) {
                pointMismatchesFound = true;
                const matchTitle = `${first.match.homeTeam} vs ${first.match.awayTeam}`;
                console.log(`\n⚠️  POINT MISMATCH: ${matchTitle} (ID: ${matchId})`);
                preds.forEach(p => {
                    const context = p.leagueId ? `League ${p.leagueId}` : 'GLOBAL';
                    console.log(`   - Context: ${context.padEnd(40)} | Pred: ${p.homeScore}-${p.awayScore} | Points: ${p.points} | Joker: ${p.isJoker}`);
                });
             }
        }
      }

      if (!discrepanciesFound) {
          console.log('\n✅ No SCORE discrepancies found! All predictions have identical scores across leagues.');
      }
      
      if (!pointMismatchesFound) {
          console.log('✅ No POINT mismatches found! Points are consistent across identical predictions.');
      }

      await AppDataSource.destroy();
  } catch (error) {
      console.error('CRITICAL ERROR:', error);
  }
}

bootstrap();
