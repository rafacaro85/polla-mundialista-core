'use server';

interface MatchInput {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
}

export async function generateAiPredictions(matches: MatchInput[]) {
    const API_KEY = process.env.GOOGLE_API_KEY;

    if (!API_KEY) {
        console.error('GOOGLE_API_KEY is not set');
        return { success: false, error: 'API Key no configurada en el servidor' };
    }

    const prompt = `
Actúa como "SoccerBet Strategist", un agente de inteligencia artificial de élite.
Analiza los siguientes partidos del Mundial 2026 y genera un resultado realista (marcador exacto) para cada uno.

Partidos a analizar:
${JSON.stringify(matches, null, 2)}

INSTRUCCIONES DE SALIDA:
Devuelve ÚNICAMENTE un objeto JSON válido donde la clave sea el matchId y el valor sea [golesLocal, golesVisitante].
NO añadas texto extra, ni markdown, solo el JSON puro.
Ejemplo: { "id1": [2, 1], "id2": [0, 0] }
`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    // Intentar con gemini-1.5-flash
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    try {
        console.log(`Enviando petición REST a ${model}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error de API Google:', errorData);
            throw new Error(errorData.error?.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('La IA no devolvió texto');
        }

        // Limpieza extra por seguridad
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const predictions = JSON.parse(cleanText);

        return { success: true, data: predictions };

    } catch (error: any) {
        console.error('Error generando predicciones (REST):', error);
        return { success: false, error: error.message || 'Error de conexión con IA' };
    }
}
