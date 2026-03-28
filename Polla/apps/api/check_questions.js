const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'sqlite',
  database: '../../data/polla.sqlite',
});

async function run() {
  await dataSource.initialize();
  const questions = await dataSource.query(`
    SELECT id, text, "isActive", "correctAnswer", "league_id", "tournamentId" 
    FROM bonus_questions
    ORDER BY "createdAt" DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(questions, null, 2));
  
  const answers = await dataSource.query(`
    SELECT * FROM user_bonus_answers
    ORDER BY "createdAt" DESC
    LIMIT 10
  `);
  console.log('Answers:', JSON.stringify(answers, null, 2));
  await dataSource.destroy();
}

run().catch(console.error);
