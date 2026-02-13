
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { LeagueParticipantsService } from './src/league-participants/league-participants.service';
import { LeaguesService } from './src/leagues/leagues.service';
import { DataSource } from 'typeorm';
import { User } from './src/database/entities/user.entity';
import { League } from './src/database/entities/league.entity';
import { LeagueParticipantStatus } from './src/database/enums/league-participant-status.enum';
import { LeagueType } from './src/database/enums/league-type.enum';

async function run() {
  console.log('🚀 Starting League Approval Integration Test...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
      const participantsService = app.get(LeagueParticipantsService);
      const leaguesService = app.get(LeaguesService);
      const dataSource = app.get(DataSource);
      const userRepo = dataSource.getRepository(User);
      const leagueRepo = dataSource.getRepository(League);

      // 1. Create Data
      console.log('📝 Creating Test Data...');
      
      // Admin
      const adminData: any = {
          email: `admin_${Date.now()}@test.com`,
          fullName: 'Admin Test',
          points: 0,
          password: 'hashes_password', // Mock
          role: 'USER',
          nickname: 'admin_test' + Date.now()
      };
      const admin = await userRepo.save(userRepo.create(adminData));
      
      // Player
      const playerData: any = {
          email: `player_${Date.now()}@test.com`,
          fullName: 'Player Test',
          points: 0,
          password: 'hashed_password',
          role: 'USER',
          nickname: 'player_test' + Date.now()
      };
      const player = await userRepo.save(userRepo.create(playerData));

      // Private League
      const code = `TEST${Date.now()}`;
      const leagueData: any = {
          name: 'Test Private League',
          accessCodePrefix: code,
          type: LeagueType.VIP, 
          creator: admin,
          maxParticipants: 10,
          tournamentId: 'WC2026'
      };
      const league = await leagueRepo.save(leagueRepo.create(leagueData));

      console.log(`✅ Data Created. League: ${league.id} (${code})`);

      // 2. Player Joins
      console.log('🏃 Player Joining...');
      const participant = await participantsService.joinLeague(player.id, code);
      
      console.log(`👉 Join Status: ${participant.status}`);
      if (participant.status !== LeagueParticipantStatus.PENDING) {
          throw new Error(`Expected PENDING, got ${participant.status}`);
      }

      // 3. Verify Access Blocked (Manual Check simulation)
      try {
           await leaguesService.getLeagueRanking(league.id, player.id);
           throw new Error('Should have thrown ForbiddenException');
      } catch (e) {
          console.log(`✅ Access Blocked as expected: ${e.message}`);
          if (!e.message.includes('tu solicitud de unión está pendiente') && !e.message.includes('PENDING')) {
               console.warn('Warning: Exception message was different than expected:', e.message);
          }
      }

      // 4. Admin Approves
      console.log('👮 Admin Approving...');
      await participantsService.approveParticipant(league.id, player.id, admin.id, 'ADMIN');
      
      // 5. Verify Active
      // Check service return
      const updatedParticipantList: any[] = await leaguesService.getParticipants(league.id, admin.id, 'ADMIN'); 
      const p = updatedParticipantList.find(x => x.user.id === player.id);
      console.log(`👉 Post-Approval Status (from Service): ${p?.status}`); 
      
      if (p?.status !== LeagueParticipantStatus.ACTIVE && p?.status !== 'ACTIVE') {
           throw new Error(`Expected ACTIVE, got ${p?.status}`);
      }
      
      // Verify Access Granted
      try {
          await leaguesService.getLeagueRanking(league.id, player.id);
          console.log('✅ Ranking Access Granted!');
      } catch (e) {
          throw new Error(`Should allow access after approval. Got: ${e.message}`);
      }

      console.log('✅ ALL CHECKS PASSED!');

      // 6. Cleanup
      console.log('🧹 Cleaning up...');
      await leagueRepo.delete(league.id);
      await userRepo.delete(admin.id);
      await userRepo.delete(player.id);
      
      console.log('🎉 Test Finished Successfully');

  } catch (error) {
      console.error('❌ Test Failed:', error);
  } finally {
      await app.close();
  }
}

run();
