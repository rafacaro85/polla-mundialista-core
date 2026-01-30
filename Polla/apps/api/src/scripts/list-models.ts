
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log('Listing available models for the Gemini API key...');
        const models = await genAI.listModels();
        for (const model of models.models) {
            console.log(`Model: ${model.name} (${model.displayName})`);
            console.log(`  Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
    } catch (error) {
        console.error('❌ Failed to list models:', error.message);
    }
}

listModels();
