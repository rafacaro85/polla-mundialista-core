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

export async function generateAiPredictions(matches: MatchInput[]): Promise<PredictionOutput | null> {
    if (!process.env.GOOGLE_API_KEY) {
        console.error('GOOGLE_API_KEY is not set');
        throw new Error('La clave de API de Google no está configurada');
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
        return predictions;
    } catch (error) {
        console.error('Error generating AI predictions:', error);
        throw new Error('Error al generar predicciones con IA');
    }
}
