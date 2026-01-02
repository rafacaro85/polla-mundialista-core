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

IMPORTANTE: Sé creativo y varía tus predicciones. No des siempre los mismos marcadores (como 2-1 o 1-1). Considera posibles empates, goleadas ocasionales y sorpresas tácticas basadas en la historia de los equipos.

Partidos a analizar:
${JSON.stringify(matches, null, 2)}

INSTRUCCIONES DE SALIDA:
Devuelve ÚNICAMENTE un objeto JSON válido donde la clave sea el matchId y el valor sea [golesLocal, golesVisitante].
NO añadas texto extra, ni markdown, solo el JSON puro.
Ejemplo: { "id1": [2, 1], "id2": [3, 0], "id3": [0, 2] }
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
            responseMimeType: "application/json",
            temperature: 1.0, // Aumentamos la temperatura para mayor aleatoriedad
            topP: 0.95,
            topK: 40
        }
    };

    // Paso 1: Descubrir modelos disponibles
    let selectedModel = 'gemini-1.5-flash'; // Fallback por defecto

    try {
        console.log('Consultando modelos disponibles...');
        const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const modelsRes = await fetch(modelsUrl);

        if (modelsRes.ok) {
            const modelsData = await modelsRes.json();
            const availableModels = modelsData.models || [];

            // Buscar un modelo Gemini preferido
            const preferredModels = [
                'models/gemini-1.5-flash',
                'models/gemini-1.5-flash-latest',
                'models/gemini-1.5-flash-001',
                'models/gemini-pro',
                'models/gemini-1.0-pro'
            ];

            const foundModel = availableModels.find((m: any) =>
                preferredModels.includes(m.name) &&
                m.supportedGenerationMethods?.includes('generateContent')
            );

            // Si no encontramos uno preferido, tomar cualquiera que sea gemini y soporte generateContent
            const fallbackModel = availableModels.find((m: any) =>
                m.name.includes('gemini') &&
                m.supportedGenerationMethods?.includes('generateContent')
            );

            if (foundModel) {
                selectedModel = foundModel.name.replace('models/', '');
                console.log(`Modelo seleccionado (preferido): ${selectedModel}`);
            } else if (fallbackModel) {
                selectedModel = fallbackModel.name.replace('models/', '');
                console.log(`Modelo seleccionado (fallback): ${selectedModel}`);
            } else {
                console.warn('No se encontraron modelos Gemini explícitos en la lista. Usando default.');
                console.log('Modelos disponibles:', availableModels.map((m: any) => m.name));
            }
        } else {
            console.warn('Error listando modelos, usando default.', await modelsRes.text());
        }
    } catch (e) {
        console.error('Error en descubrimiento de modelos:', e);
    }

    // Paso 2: Generar contenido con el modelo seleccionado
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${API_KEY}`;

    try {
        console.log(`Enviando petición REST a ${selectedModel}...`);

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
            // Mensaje de error más detallado para el usuario
            const msg = errorData.error?.message || `Error ${response.status}`;
            throw new Error(`Fallo modelo ${selectedModel}: ${msg}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('La IA no devolvió texto');
        }

        // Limpieza extra por seguridad
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const predictions = JSON.parse(cleanText);

        return { success: true, data: predictions, modelUsed: selectedModel };

    } catch (error: any) {
        console.error('Error generando predicciones (REST):', error);
        return { success: false, error: error.message || 'Error de conexión con IA' };
    }
}
