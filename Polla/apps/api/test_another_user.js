const axios = require('axios');
async function run() {
    try {
        const res = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'prueba@admin.com',
            password: 'any' 
        });
        console.log('✅ Login successful:', res.data);
    } catch (err) {
        console.error('❌ Login failed:', err.response ? err.response.status : err.message);
        if (err.response) {
            console.error('Response body:', err.response.data);
        }
    }
}
run();
