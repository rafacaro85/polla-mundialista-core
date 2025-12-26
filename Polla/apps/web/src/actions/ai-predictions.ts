'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface MatchInput {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
}

interface PredictionOutput {
    [matchId: string]: [number, number];
}

export async function generateAiPredictions(matches: MatchInput[]) {
    if (!process.env.GOOGLE_API_KEY) {
        console.error('GOOGLE_API_KEY is not set');
        return { success: false, error: 'API Key no configurada en el servidor' };
    }

    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Intentando conectar con modelo: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
Actúa como "SoccerBet Strategist", un agente de inteligencia artificial de élite, especializado única y exclusivamente en el análisis de partidos de fútbol.
Tu propósito es operar con la precisión de un analista cuantitativo.

Analiza los siguientes partidos del Mundial 2026 y genera un resultado realista (marcador exacto) para cada uno.
Considera estadísticas históricas, forma actual y probabilidades teóricas.

Partidos a analizar:
${JSON.stringify(matches, null, 2)}

INSTRUCCIONES DE SALIDA:
Devuelve ÚNICAMENTE un objeto JSON válido donde la clave sea el matchId y el valor sea [golesLocal, golesVisitante].
NO añadas texto extra, ni markdown (sin \`\`\`json), solo el objeto JSON puro.

Ejemplo de respuesta válida:
{
  "match-id-1": [2, 1],
  "match-id-2": [0, 0]
}
`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Limpiar el texto de posibles bloques de código markdown
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const predictions = JSON.parse(cleanText);
            return { success: true, data: predictions };

        } catch (error: any) {
            console.warn(`Fallo con modelo ${modelName}:`, error.message);
            lastError = error;
            // Continuar con el siguiente modelo
        }
    }

    console.error('Todos los modelos fallaron. Último error:', lastError);
    return { success: false, error: lastError?.message || 'Error al generar predicciones con todos los modelos de IA' };
}
