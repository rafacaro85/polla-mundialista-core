
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

async function test() {
    console.log('Waiting 5s for quota cooldown...');
    await new Promise(r => setTimeout(r, 5000));
    console.log('Testing Gemini API with models/gemini-2.0-flash-lite...');
    console.log('API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
    try {
        const prompt = 'Analiza el partido Uzbekistán vs Colombia y predice el resultado en JSON { "predictedScore": "X-Y", "confidence": "high", "reasoning": "..." }';
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
