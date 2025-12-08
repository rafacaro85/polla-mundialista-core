"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Star, Award, Edit3, Trash2, Trophy, Loader2, HelpCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface BonusQuestion {
    id: string;
    text: string;
    points: number;
    isActive: boolean;
    correctAnswer?: string;
    leagueId?: string;
}

interface LeagueBonusQuestionsProps {
    leagueId: string;
}

export function LeagueBonusQuestions({ leagueId }: LeagueBonusQuestionsProps) {
    const [questions, setQuestions] = useState<BonusQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ text: '', points: 5 });

    useEffect(() => {
        loadQuestions();
    }, [leagueId]);

    const loadQuestions = async () => {
        try {
            const { data } = await api.get('/bonus/questions/all');
            // Filter questions for this league
            const leagueQuestions = data.filter((q: BonusQuestion) => q.leagueId === leagueId);
            setQuestions(leagueQuestions);
        } catch (error) {
            console.error('Error loading questions:', error);
            toast.error('Error al cargar las preguntas');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newQuestion.text.trim()) {
            toast.error('Escribe una pregunta');
            return;
        }

        if (newQuestion.points < 1 || newQuestion.points > 100) {
            toast.error('Los puntos deben estar entre 1 y 100');
            return;
        }

        try {
            await api.post('/bonus/questions', {
                text: newQuestion.text,
                points: newQuestion.points,
                leagueId: leagueId,
                isActive: true
            });
            toast.success('Pregunta creada exitosamente');
            setNewQuestion({ text: '', points: 5 });
            setCreating(false);
            loadQuestions();
        } catch (error) {
            console.error('Error creating question:', error);
            toast.error('Error al crear la pregunta');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta pregunta?')) return;

        try {
            await api.delete(`/bonus/questions/${id}`);
            toast.success('Pregunta eliminada');
            loadQuestions();
        } catch (error) {
            console.error('Error deleting question:', error);
            toast.error('Error al eliminar');
        }
    };

    const handleGrade = async (questionId: string) => {
        const correctAnswer = prompt('Ingresa la respuesta correcta:');
        if (!correctAnswer) return;

        try {
            await api.post(`/bonus/grade/${questionId}`, { correctAnswer });
            toast.success('Pregunta calificada');
            loadQuestions();
        } catch (error) {
            console.error('Error grading question:', error);
            toast.error('Error al calificar');
        }
    };

    const STYLES = {
        container: {
            backgroundColor: '#1E293B',
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '20px',
            marginTop: '16px'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '18px',
            color: '#00E676',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        addBtn: {
            backgroundColor: '#00E676',
            color: '#0F172A',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        createBox: {
            backgroundColor: '#0F172A',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
        },
        input: {
            width: '100%',
            padding: '12px',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            marginBottom: '12px',
            outline: 'none'
        },
        pointsInput: {
            width: '100px',
            padding: '12px',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            outline: 'none'
        },
        btnRow: {
            display: 'flex',
            gap: '8px',
            marginTop: '12px'
        },
        saveBtn: {
            flex: 1,
            padding: '10px',
            backgroundColor: '#00E676',
            color: '#0F172A',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
        },
        cancelBtn: {
            flex: 1,
            padding: '10px',
            backgroundColor: 'transparent',
            color: '#94A3B8',
            border: '1px solid #475569',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
        },
        questionCard: {
            backgroundColor: '#0F172A',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
            border: '1px solid #334155'
        },
        questionText: {
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px'
        },
        questionMeta: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px'
        },
        pointsBadge: {
            backgroundColor: 'rgba(250, 204, 21, 0.1)',
            border: '1px solid #FACC15',
            color: '#FACC15',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        actions: {
            display: 'flex',
            gap: '8px'
        },
        iconBtn: {
            padding: '6px',
            backgroundColor: 'transparent',
            border: '1px solid #475569',
            borderRadius: '6px',
            color: '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        gradeBtn: {
            padding: '6px 12px',
            backgroundColor: '#00E676',
            border: 'none',
            borderRadius: '6px',
            color: '#0F172A',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        answerBox: {
            backgroundColor: 'rgba(0, 230, 118, 0.05)',
            border: '1px dashed #00E676',
            borderRadius: '8px',
            padding: '8px',
            marginTop: '8px',
            color: '#00E676',
            fontSize: '12px'
        }
    };

    if (loading) {
        return (
            <div style={{ ...STYLES.container, textAlign: 'center' }}>
                <Loader2 className="animate-spin mx-auto" size={24} color="#00E676" />
            </div>
        );
    }

    return (
        <div style={STYLES.container}>
            <div style={STYLES.header}>
                <h3 style={STYLES.title}>
                    <Star size={20} />
                    Preguntas Bonus
                </h3>
                {!creating && (
                    <button onClick={() => setCreating(true)} style={STYLES.addBtn}>
                        <Plus size={16} />
                        Crear
                    </button>
                )}
            </div>

            {creating && (
                <div style={STYLES.createBox}>
                    <input
                        type="text"
                        placeholder="¿Cuál será tu pregunta bonus?"
                        value={newQuestion.text}
                        onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                        style={STYLES.input}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ color: '#94A3B8', fontSize: '12px' }}>Puntos:</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={newQuestion.points}
                            onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 5 })}
                            style={STYLES.pointsInput}
                        />
                    </div>
                    <div style={STYLES.btnRow}>
                        <button onClick={handleCreate} style={STYLES.saveBtn}>
                            Guardar
                        </button>
                        <button onClick={() => setCreating(false)} style={STYLES.cancelBtn}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {questions.length === 0 && !creating ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '20px' }}>
                    <HelpCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p style={{ fontSize: '12px' }}>No hay preguntas bonus aún</p>
                </div>
            ) : (
                questions.map(q => (
                    <div key={q.id} style={STYLES.questionCard}>
                        <div style={STYLES.questionText}>{q.text}</div>

                        {q.correctAnswer && (
                            <div style={STYLES.answerBox}>
                                <strong>Respuesta correcta:</strong> {q.correctAnswer}
                            </div>
                        )}

                        <div style={STYLES.questionMeta}>
                            <div style={STYLES.pointsBadge}>
                                <Star size={10} fill="#FACC15" />
                                {q.points} PTS
                            </div>
                            <div style={STYLES.actions}>
                                {!q.correctAnswer && (
                                    <button onClick={() => handleGrade(q.id)} style={STYLES.gradeBtn}>
                                        <Trophy size={12} />
                                        Calificar
                                    </button>
                                )}
                                <button onClick={() => handleDelete(q.id)} style={STYLES.iconBtn}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
