const http = require('http');

http.get('http://localhost:3001/api/matches', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
        const matches = JSON.parse(data);
        if (Array.isArray(matches)) {
            const scheduled = matches.filter(m => m.status === 'SCHEDULED');
            const r32 = matches.filter(m => m.phase === 'ROUND_32');
            console.log(`Total Matches: ${matches.length}`);
            console.log(`SCHEDULED Matches: ${scheduled.length}`);
            console.log(`ROUND_32 Matches: ${r32.length}`);
            r32.slice(0, 5).forEach(m => console.log(`${m.id} | ${m.homeTeam} vs ${m.awayTeam} | Status: ${m.status}`));
        }
    } catch (e) {
        console.log('Error', e.message);
    }
  });
});
