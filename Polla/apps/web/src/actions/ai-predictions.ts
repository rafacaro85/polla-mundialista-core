'use server';

import api from '@/lib/api';

interface MatchInput {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
}

export async function generateAiPredictions(matches: MatchInput[]) {
    try {
        console.log(`[FE-IA] Recuperando predicciones para ${matches.length} partidos vía Backend...`);

        const matchIds = matches.map(m => m.id);
        
        // Llamar al backend que maneja el cache y la lógica de cuota
        const { data } = await api.post('/ai-predictions/bulk', { matchIds });

        console.log('[FE-IA] Predicciones recuperadas exitosamente del cache/IA del backend.');

        return { 
            success: true, 
            data: data, 
            cached: true // Informamos que viene del sistema de cache centralizado
        };

    } catch (error: any) {
        console.error('Error recuperando predicciones desde Backend:', error);
        return { 
            success: false, 
            error: error.message || 'Error de conexión con el servidor de predicciones' 
        };
    }
}
