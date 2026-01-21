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
    type?: 'OPEN' | 'MULTIPLE';
    options?: string[];
}

interface LeagueBonusQuestionsProps {
    leagueId: string;
}

export function LeagueBonusQuestions({ leagueId }: LeagueBonusQuestionsProps) {
    const [questions, setQuestions] = useState<BonusQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ 
        text: '', 
        points: '' as any,
        type: 'OPEN' as 'OPEN' | 'MULTIPLE',
        options: [] as string[],
        currentOption: ''
    });

    useEffect(() => {
        loadQuestions();
    }, [leagueId]);

    const loadQuestions = async () => {
        try {
            // Updated: Pass leagueId to params to authorize request on backend
            const { data } = await api.get('/bonus/questions/all', { params: { leagueId } });
            
            // Filter questions for this league (Backend now does this too via filtering, but safe to keep)
            // But we can just use the data if backend already filters.
            // Let's keep filter just in case API changes, but it's redundant now.
            const leagueQuestions = data.filter((q: BonusQuestion) => q.leagueId === leagueId);
            setQuestions(leagueQuestions);
            
        } catch (error) {
            console.error('Error loading questions:', error);
            // toast.error('Error al cargar las preguntas'); // Evitar spam si falla permisos
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newQuestion.text.trim()) {
            toast.error('Escribe una pregunta');
            return;
        }

        const points = parseInt(newQuestion.points as any);
        if (!points || points < 1 || points > 100) {
            toast.error('Los puntos deben estar entre 1 y 100');
            return;
        }

        try {
            await api.post('/bonus/questions', {
                text: newQuestion.text,
                points: points,
                leagueId: leagueId,
                leagueId: leagueId,
                isActive: true,
                type: newQuestion.type,
                options: newQuestion.type === 'MULTIPLE' ? newQuestion.options : []
            });
            toast.success('Pregunta creada exitosamente');
            setNewQuestion({ 
                text: '', 
                points: '' as any, 
                type: 'OPEN', 
                options: [], 
                currentOption: '' 
            });
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

                    {/* TYPE SELECTOR & OPTIONS UI */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
                             <label style={{ color: '#94A3B8', fontSize: '12px' }}>Tipo:</label>
                             <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1E293B', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                                <button
                                    onClick={() => setNewQuestion({...newQuestion, type: 'OPEN'})}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        border: 'none',
                                        backgroundColor: newQuestion.type === 'OPEN' ? '#00E676' : 'transparent',
                                        color: newQuestion.type === 'OPEN' ? '#0F172A' : '#94A3B8',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Abierta
                                </button>
                                <button
                                    onClick={() => setNewQuestion({...newQuestion, type: 'MULTIPLE'})}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        border: 'none',
                                        backgroundColor: newQuestion.type === 'MULTIPLE' ? '#00E676' : 'transparent',
                                        color: newQuestion.type === 'MULTIPLE' ? '#0F172A' : '#94A3B8',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Opción Múltiple
                                </button>
                             </div>
                        </div>

                        {newQuestion.type === 'MULTIPLE' && (
                            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                                <label style={{ color: '#94A3B8', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                                    Opciones de respuesta:
                                </label>
                                
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. Messi"
                                        value={newQuestion.currentOption}
                                        onChange={(e) => setNewQuestion({...newQuestion, currentOption: e.target.value})}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (!newQuestion.currentOption?.trim()) return;
                                                setNewQuestion({
                                                    ...newQuestion,
                                                    options: [...(newQuestion.options || []), newQuestion.currentOption.trim()],
                                                    currentOption: ''
                                                });
                                            }
                                        }}
                                        style={{ ...STYLES.input, marginBottom: 0, fontSize: '12px', padding: '8px' }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (!newQuestion.currentOption?.trim()) return;
                                            setNewQuestion({
                                                ...newQuestion,
                                                options: [...(newQuestion.options || []), newQuestion.currentOption.trim()],
                                                currentOption: ''
                                            });
                                        }}
                                        style={{ ...STYLES.addBtn, padding: '0 12px' }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {newQuestion.options?.map((opt, idx) => (
                                        <div key={idx} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            backgroundColor: '#0F172A',
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            color: 'white',
                                            border: '1px solid #334155'
                                        }}>
                                            <span>{opt}</span>
                                            <button 
                                                onClick={() => {
                                                    const newOpts = [...(newQuestion.options || [])];
                                                    newOpts.splice(idx, 1);
                                                    setNewQuestion({...newQuestion, options: newOpts});
                                                }}
                                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!newQuestion.options || newQuestion.options.length === 0) && (
                                        <div style={{ fontSize: '10px', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                                            Agrega al menos 2 opciones
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

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
