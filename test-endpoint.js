const axios = require('axios');

const email = 'test_auth_user_' + Date.now() + '@example.com';
const password = 'password123';
const BACKEND_URL = 'http://localhost:8080';

async function testAuthFlow() {
    try {
        console.log(`1. Registering ${email}...`);
        try {
            await axios.post(`${BACKEND_URL}/auth/register`, { email, password });
            console.log('   Registration Successful/User exists.');
        } catch (err) {
            // Ignore if already exists for re-runs (though we use random email now)
            if (err.response && err.response.status === 400) {
                console.log('   User already exists (expected if re-running).');
            } else {
                throw err;
            }
        }

        console.log(`2. Logging in...`);
        const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        console.log('   Login Successful. Token obtained.');

        console.log(`3. Fetching balance...`);
        const balanceRes = await axios.get(`${BACKEND_URL}/get_balance`, {
            headers: { 'x-auth-token': token }
        });

        console.log('   Balance:', balanceRes.data.balance);
        console.log('SUCCESS: Full Auth Flow working.');

    } catch (error) {
        console.error('FAILURE:', error.response ? error.response.data : error.message);
    }
}

testAuthFlow();
