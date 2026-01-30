
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

async function test() {
    console.log('Testing Gemini API with models/gemini-1.5-flash...');
    console.log('API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
    try {
        const prompt = 'Hola, responde con "OK" si recibes esto.';
        const result = await model.generateContent(prompt);
        console.log('Response:', result.response.text());
        console.log('✅ Gemini API is working!');
    } catch (error) {
        console.error('❌ Gemini API failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Full error:', error);
        }
    }
}

test();
