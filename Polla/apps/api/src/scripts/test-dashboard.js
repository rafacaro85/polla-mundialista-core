const axios = require('axios');

async function testDashboard() {
    console.log('--- Testing Dashboard Endpoints ---');
    const tournamentId = 'UCL2526';
    const baseUrl = 'http://localhost:3000/api';

    const endpoints = [
        `/knockout-phases/status?tournamentId=${tournamentId}`,
        `/knockout-phases/next/info?tournamentId=${tournamentId}`,
        `/matches/live?tournamentId=${tournamentId}`
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing GET ${endpoint}...`);
            const response = await axios.get(`${baseUrl}${endpoint}`);
            console.log(`✅ ${endpoint}: 200 (Matches: ${response.data.length || 'ok'})`);
        } catch (error) {
            console.error(`❌ ${endpoint}: ${error.response ? error.response.status : error.message}`);
            if (error.response && error.response.data) {
                console.error('Error info:', error.response.data);
            }
        }
    }
}

testDashboard();
