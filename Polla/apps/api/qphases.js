const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/polla_mundialista' });
c.connect()
  .then(() => c.query(`
    SELECT DISTINCT phase, COUNT(*) as total 
    FROM matches 
    WHERE "tournamentId" = 'UCL2526' 
    GROUP BY phase 
    ORDER BY phase
  `))
  .then(r => { 
    if (r.rows.length === 0) { console.log('VACÍO'); return; }
    r.rows.forEach(row => console.log(`phase="${row.phase}" | count=${row.total}`)); 
    c.end(); 
  })
  .catch(e => { 
    console.log('Error con "matches", intentando "match"...');
    c.query(`SELECT DISTINCT phase, COUNT(*) as total FROM match WHERE "tournamentId" = 'UCL2526' GROUP BY phase ORDER BY phase`)
    .then(r => { r.rows.forEach(row => console.log(`phase="${row.phase}" | count=${row.total}`)); c.end(); })
    .catch(e2 => { console.error('Error:', e.message, e2.message); c.end(); });
  });
