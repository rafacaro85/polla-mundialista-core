'use client';

import React, { useState } from 'react';
import { generateAiPredictions } from '@/actions/ai-predictions';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Match {
    id: string;
    homeTeam: string | { code: string; flag: string } | any;
    awayTeam: string | { code: string; flag: string } | any;
    date: string;
    [key: string]: any;
}

interface AiAssistButtonProps {
    matches: Match[];
    onPredictionsGenerated: (predictions: { [matchId: string]: [number, number] }) => void;
}

export function AiAssistButton({ matches, onPredictionsGenerated }: AiAssistButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Helper function to check if a team is a real team (not placeholder)
            const isRealTeam = (team: string) => {
                // EMERGENCY LOG - VERSION 2.1 (Fixing Playoff filter)
                if (team?.startsWith('PLA_')) return true; 

                if (!team || team === '' || team === 'TBD') return false;
                
                // Only filter winners/losers and bracket placeholders (1A, 2B, etc.)
                if (/^[0-9][A-Z]/.test(team)) return false; 
                if (/^[0-9]RD-/.test(team)) return false; 
                if (/^W[0-9]/.test(team)) return false; 
                if (/^L-/.test(team)) return false;
                
                return true;
            };

            // Filter matches to only include those with defined teams (not TBD, not placeholders)
            // This ensures we only predict the current playable phase
            const rejectedMatches: any[] = [];
            
            const playableMatches = matches.filter(m => {
                const home = (typeof m.homeTeam === 'object' ? m.homeTeam.code : m.homeTeam) || '';
                const away = (typeof m.awayTeam === 'object' ? m.awayTeam.code : m.awayTeam) || '';
                
                const homeValid = isRealTeam(home);
                const awayValid = isRealTeam(away);

                if (!homeValid || !awayValid) {
                    rejectedMatches.push({
                        id: m.id,
                        home: home,
                        away: away,
                        reason: !homeValid ? `Home invalid: ${home}` : `Away invalid: ${away}`
                    });
                    return false;
                }

                // 🔒 FILTER OUT FINISHED OR LOCKED MATCHES
                if (m.status === 'FINISHED' || m.status === 'COMPLETED') {
                     rejectedMatches.push({ id: m.id, reason: 'Match is FINISHED' });
                     return false;
                }

                const matchDate = new Date(m.date);
                const tenMinutes = 10 * 60 * 1000;
                const now = new Date();
                
                if (now.getTime() >= matchDate.getTime() - tenMinutes) {
                    rejectedMatches.push({ id: m.id, reason: 'Match is TIME LOCKED' });
                    return false;
                }
                
                return true;
            });

            if (rejectedMatches.length > 0) {
                console.warn('⚠️ Partidos excluidos de IA:', rejectedMatches);
                console.table(rejectedMatches.slice(0, 10)); // Show first 10
            }

            if (playableMatches.length === 0) {
                toast.error('No hay partidos disponibles para predecir en esta fase.');
                setLoading(false);
                return;
            }

            console.log(`🤖 IA va a predecir ${playableMatches.length} partidos de ${matches.length} totales`);

            // Preparar los datos para la IA solo con lo necesario
            const matchesForAi = playableMatches.map(m => {
                const home = (typeof m.homeTeam === 'object' ? m.homeTeam.code : m.homeTeam) || '';
                const away = (typeof m.awayTeam === 'object' ? m.awayTeam.code : m.awayTeam) || '';
                
                return {
                    id: m.id,
                    homeTeam: home,
                    awayTeam: away,
                    date: m.date
                };
            });

            const response = await generateAiPredictions(matchesForAi);

            if (response.success && response.data) {
                onPredictionsGenerated(response.data);
                toast.success(`¡La IA ha completado ${playableMatches.length} predicciones! Revisa y guarda.`);
            } else {
                console.error('AI Error:', response.error);
                toast.error(`Error: ${response.error || 'No se pudieron generar predicciones'}`);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al contactar con la IA.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group border border-purple-400/30"
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <Sparkles className="w-5 h-5 text-yellow-200 group-hover:scale-110 transition-transform" />
            )}
            <span>{loading ? 'Consultando IA...' : 'Sugerir Resultados con IA'}</span>
        </button>
    );
}
