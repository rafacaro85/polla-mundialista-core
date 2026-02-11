import React, { useState, useEffect } from 'react';
import { Star, Gift, Clock, CheckCircle, XCircle, Lock, Award, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTournament } from '@/hooks/useTournament';

/* =============================================================================
   INTERFACES
   ============================================================================= */
interface BonusQuestion {
    id: string;
    text: string;
    points: number;
    isActive: boolean;
    correctAnswer?: string;
    type?: 'OPEN' | 'MULTIPLE';
    options?: string[];
}

interface UserAnswer {
    id: string;
    questionId: string;
    answer: string;
    pointsEarned: number;
}

/* =============================================================================
   COMPONENTE: BONUS VIEW (DESAFÍOS)
   ============================================================================= */
interface BonusViewProps {
    leagueId?: string;
}

export const BonusView: React.FC<BonusViewProps> = ({ leagueId }) => {
    const { tournamentId } = useTournament();
    // ESTADO
    const [questions, setQuestions] = useState<BonusQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [answersInput, setAnswersInput] = useState<Record<string, string>>({});

    // CARGAR DATOS
    useEffect(() => {
        loadData();
    }, [leagueId, tournamentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            const [questionsRes, answersRes] = await Promise.all([
                api.get('/bonus/questions', { 
                    params: { leagueId, tournamentId } 
                }),
                api.get('/bonus/my-answers', { 
                    params: { leagueId, tournamentId } 
                })
            ]);


            setQuestions(questionsRes.data);

            const answersMap: Record<string, UserAnswer> = {};
            const inputsMap: Record<string, string> = {};

            answersRes.data.forEach((ans: UserAnswer) => {
                answersMap[ans.questionId] = ans;
                inputsMap[ans.questionId] = ans.answer;
            });

            setUserAnswers(answersMap);
            setAnswersInput(inputsMap);
        } catch (error) {
            console.error('Error loading bonus data:', error);
            toast.error('Error al cargar las preguntas bonus');
        } finally {
            setLoading(false);
        }
    };

    // GUARDAR RESPUESTA
    const handleSaveAnswer = async (questionId: string) => {
        const answer = answersInput[questionId];
        if (!answer?.trim()) {
            toast.error('La respuesta no puede estar vacía');
            return;
        }

        setSaving(prev => ({ ...prev, [questionId]: true }));
        try {
            const { data } = await api.post('/bonus/answer', {
                questionId,
                answer
            });

            setUserAnswers(prev => ({
                ...prev,
                [questionId]: data
            }));

            toast.success('Respuesta guardada exitosamente');
        } catch (error) {
            console.error('Error saving answer:', error);
            toast.error('Error al guardar la respuesta');
        } finally {
            setSaving(prev => ({ ...prev, [questionId]: false }));
        }
    };

    // SISTEMA DE DISEÑO
    const COLORS = {
        bg: '#0F172A',
        card: '#1E293B',
        signal: '#00E676',
        gold: '#FACC15',
        alert: '#FF1744',
        text: '#F8FAFC',
        dim: '#94A3B8',
        border: '#334155'
    };

    const STYLES = {
        container: {
            padding: '16px',
            paddingBottom: '120px',
            backgroundColor: COLORS.bg,
            minHeight: '100vh',
            fontFamily: 'sans-serif'
        },
        headerSection: {
            textAlign: 'center' as const,
            marginBottom: '24px',
            marginTop: '10px'
        },
        headerIconBox: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(250, 204, 21, 0.1)', // Gold sutil
            border: `1px solid ${COLORS.gold}`,
            marginBottom: '12px',
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.2)'
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '26px',
            color: 'white',
            textTransform: 'uppercase' as const,
            marginBottom: '4px',
            letterSpacing: '1px'
        },
        subtitle: {
            fontSize: '11px',
            color: COLORS.dim,
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase' as const
        },

        // --- TARJETA DE PREGUNTA ---
        card: {
            backgroundColor: COLORS.card,
            borderRadius: '16px',
            border: `1px solid ${COLORS.border}`,
            padding: '16px',
            marginBottom: '16px',
            position: 'relative' as const,
            overflow: 'hidden',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        },
        cardHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px'
        },
        pointsBadge: {
            backgroundColor: 'rgba(250, 204, 21, 0.15)', // Gold transparente
            color: COLORS.gold,
            border: `1px solid ${COLORS.gold}`,
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: '900',
            fontFamily: "'Russo One', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 0 10px rgba(250, 204, 21, 0.2)'
        },
        questionText: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            lineHeight: '1.4',
            marginBottom: '16px'
        },
        inputBox: {
            display: 'flex',
            gap: '8px'
        },
        input: {
            flex: 1,
            backgroundColor: '#0F172A',
            border: '1px solid #475569',
            borderRadius: '8px',
            padding: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            outline: 'none'
        },
        saveBtn: {
            backgroundColor: COLORS.signal,
            color: '#0F172A',
            border: 'none',
            borderRadius: '8px',
            padding: '0 16px',
            fontWeight: '900',
            textTransform: 'uppercase' as const,
            fontSize: '11px',
            cursor: 'pointer',
            boxShadow: '0 0 10px rgba(0,230,118,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        // Estado Cerrado / Calificado
        statusFooter: {
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 'bold'
        },
        lockedOverlay: {
            position: 'absolute' as const,
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            color: COLORS.dim
        }
    };

    if (loading) {
        return <div className="text-center p-8 text-white">Cargando preguntas bonus...</div>;
    }

    return (
        <div style={STYLES.container}>

            {/* 1. HEADER */}
            <div style={STYLES.headerSection}>
                <div style={STYLES.headerIconBox}>
                    <Gift size={28} color={COLORS.gold} strokeWidth={2.5} />
                </div>
                <h2 style={STYLES.title}>Bonus Zone</h2>
                <p style={STYLES.subtitle}>Preguntas especiales • Puntos Extra</p>
                <div className="mt-4 bg-signal/10 inline-block px-4 py-1 rounded-full border border-signal/30">
                    <p className="text-xs font-bold text-signal">
                        Tus Puntos: {Object.values(userAnswers).reduce((acc, curr) => acc + curr.pointsEarned, 0)}
                    </p>
                </div>
            </div>

            {/* 2. LISTA DE PREGUNTAS */}
            <div>
                {questions.map((q) => {
                    const userAnswer = userAnswers[q.id];
                    const isGraded = !q.isActive && q.correctAnswer;
                    const isLocked = !q.isActive && !isGraded; // Si no está activa y no está calificada, asumimos cerrada/bloqueada
                    const pointsEarned = userAnswer?.pointsEarned || 0;
                    const isCorrect = pointsEarned > 0;
                    const isSaving = saving[q.id];

                    return (
                        <div key={q.id} style={STYLES.card} className="group transition-all hover:border-[var(--brand-primary,#00E676)]/30">

                            {/* Overlay de Bloqueo */}
                            {isLocked && (
                                <div style={STYLES.lockedOverlay}>
                                    <Lock size={24} style={{ marginBottom: '8px' }} />
                                    <span style={{ fontFamily: "'Russo One', sans-serif", textTransform: 'uppercase' }}>Cerrada</span>
                                    <span style={{ fontSize: '10px', marginTop: '4px' }}>Ya no se aceptan respuestas</span>
                                </div>
                            )}

                            {/* Header Tarjeta */}
                            <div style={STYLES.cardHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.dim, fontSize: '10px', fontWeight: 'bold' }}>
                                    <Clock size={12} />
                                    <span>{q.isActive ? 'Abierta' : 'Finalizada'}</span>
                                </div>
                                <div style={STYLES.pointsBadge}>
                                    <Star size={10} fill={COLORS.gold} />
                                    +{q.points} PTS
                                </div>
                            </div>

                            {/* Pregunta */}
                            <h3 style={STYLES.questionText}>{q.text}</h3>

                            {/* Área de Respuesta */}
                            {isGraded ? (
                                // Estado: YA CALIFICADO
                                <div style={{
                                    ...STYLES.statusFooter,
                                    color: isCorrect ? COLORS.signal : COLORS.alert,
                                    borderColor: isCorrect ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'
                                }}>
                                    {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    <span>
                                        {isCorrect ? `¡Correcto! Ganaste ${q.points} pts` : `Incorrecto. Era: ${q.correctAnswer}`}
                                    </span>
                                </div>
                            ) : (
                                // Estado: ABIERTO
                                <>
                                    {q.type === 'MULTIPLE' && q.options && q.options.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {q.options.map((opt, idx) => {
                                                const isSelected = answersInput[q.id] === opt;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            if (!q.isActive || isLocked) return;
                                                            setAnswersInput(prev => ({ ...prev, [q.id]: opt }));
                                                        }}
                                                        disabled={!q.isActive || isLocked}
                                                        style={{
                                                            padding: '12px',
                                                            borderRadius: '8px',
                                                            textAlign: 'left',
                                                            backgroundColor: isSelected ? 'rgba(0, 230, 118, 0.15)' : '#0F172A',
                                                            border: isSelected ? `1px solid ${COLORS.signal}` : '1px solid #475569',
                                                            color: isSelected ? COLORS.signal : 'white',
                                                            fontWeight: isSelected ? 'bold' : 'normal',
                                                            cursor: (!q.isActive || isLocked) ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.2s',
                                                            fontSize: '14px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <span>{opt}</span>
                                                        {isSelected && <CheckCircle size={16} />}
                                                    </button>
                                                );
                                            })}
                                            {/* Botón Guardar específico para Múltiple (opcional, o reusar el de abajo si se ve mejor) */}
                                            {q.isActive && !isLocked && (
                                                <button
                                                    style={{ ...STYLES.saveBtn, marginTop: '8px', padding: '12px', justifyContent: 'center', width: '100%' }}
                                                    onClick={() => handleSaveAnswer(q.id)}
                                                    disabled={isSaving || !answersInput[q.id]}
                                                >
                                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                    {isSaving ? 'GUARDANDO...' : 'CONFIRMAR RESPUESTA'}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        // INPUT DE TEXTO (Default)
                                        <div style={STYLES.inputBox}>
                                            <input
                                                type="text"
                                                value={answersInput[q.id] || ''}
                                                onChange={(e) => setAnswersInput(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                placeholder="Escribe tu predicción..."
                                                style={STYLES.input}
                                                disabled={!q.isActive || isLocked}
                                            />
                                            {q.isActive && !isLocked && (
                                                <button
                                                    style={{ ...STYLES.saveBtn, opacity: isSaving ? 0.7 : 1 }}
                                                    onClick={() => handleSaveAnswer(q.id)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                    {isSaving ? '...' : 'GUARDAR'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                        </div>
                    );
                })}
            </div>

            {/* Empty State (Si no hubiera preguntas) */}
            {questions.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    border: '1px dashed #334155',
                    borderRadius: '16px',
                    color: '#94A3B8',
                    backgroundColor: '#1E293B',
                    marginTop: '20px'
                }}>
                    <Award size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <h3 style={{ fontFamily: "'Russo One', sans-serif", color: 'white', marginBottom: '8px' }}>
                        SIN BONUS ACTIVOS
                    </h3>
                    <p style={{ fontSize: '12px' }}>
                        Las preguntas especiales aparecerán aquí pronto.
                    </p>
                </div>
            )}

        </div>
    );
};
