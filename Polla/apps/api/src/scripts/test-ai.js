const axios = require('axios');

async function test() {
    try {
        console.log('Testing direct backend AI bulk predictions (Port 3001)...');
        const response = await axios.post('http://localhost:3001/api/ai-predictions/bulk?tournamentId=UCL2526', {
            matchIds: [
              '8094878a-b67e-432f-822a-dbad59619810',
              'e12aef26-aebe-4cc6-b3fa-fb2d3c7c3ffa',
              '572aa4c2-7ae6-4c7c-98cd-8454d4a575e2',
              '15ee5c24-7b44-405a-a9d3-87093b01f082',
              '2f487854-a5db-4a78-8092-a20b41e68b32',
              'aeb3c0d3-3ac3-4164-b937-5302c6259ef9',
              'a9a7843a-df1f-492c-a38a-9f38abc78316',
              'e2d80293-d80c-471c-9ede-55466d7fa3a7'
            ]
        });
        console.log('Response status:', response.status);
        console.log('Results count:', Object.keys(response.data).length);
    } catch (error) {
        console.error('Error:', error.response ? error.response.status : error.message);
        if (error.response && error.response.data) {
            console.error('Error data:', error.response.data);
        }
    }
}

test();
