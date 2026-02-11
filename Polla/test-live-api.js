const axios = require('axios');

async function testApi() {
    const API_URL = "https://api.lapollavirtual.com/api";
    const TOURNAMENT_ID = 'UCL2526';

    try {
        console.log(`📡 Testing API for tournament: ${TOURNAMENT_ID}`);
        
        // 1. Check Phases
        const phasesRes = await axios.get(`${API_URL}/knockout-phases/status`, {
            params: { tournamentId: TOURNAMENT_ID }
        });
        console.log('✅ Knockout Phases Status:');
        console.table(phasesRes.data.map(p => ({ 
            phase: p.phase, 
            unlocked: p.isUnlocked, 
            completed: p.allMatchesCompleted 
        })));

        // 2. Check Matches
        const matchesRes = await axios.get(`${API_URL}/matches/live`, {
            params: { tournamentId: TOURNAMENT_ID }
        });
        console.log(`✅ Matches found: ${matchesRes.data.length}`);
        if (matchesRes.data.length > 0) {
            console.table(matchesRes.data.slice(0, 3).map(m => ({
                id: m.id,
                home: m.homeTeam,
                away: m.awayTeam,
                phase: m.phase,
                date: m.date
            })));
        }

    } catch (err) {
        console.error('❌ API Test Failed:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

testApi();
