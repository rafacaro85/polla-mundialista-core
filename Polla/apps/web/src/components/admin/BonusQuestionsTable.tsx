"use client";

import React, { useState, useEffect } from 'react';
import { Search, HelpCircle, Star, CheckCircle, Lock, Clock, Trash2, Edit3, Award, Plus, Trophy, Loader2, Shield } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { CreateQuestionDialog } from './CreateQuestionDialog';
import { EditQuestionDialog } from './EditQuestionDialog';
import { GradeQuestionDialog } from './GradeQuestionDialog';

interface BonusQuestion {
    id: string;
    text: string;
    points: number;
    isActive: boolean;
    correctAnswer?: string;
    createdAt: string;
    status?: 'OPEN' | 'CLOSED' | 'GRADED' | 'LOCKED';
    responses?: number;
}

export function BonusQuestionsTable() {
    const [questions, setQuestions] = useState<BonusQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog States
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<BonusQuestion | null>(null);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            const { data } = await api.get('/bonus/questions/all');
            const mappedQuestions = data.map((q: any) => ({
                ...q,
                status: q.isActive ? 'OPEN' : (q.correctAnswer ? 'GRADED' : 'CLOSED'),
                responses: Math.floor(Math.random() * 100) // Mock responses count for now
            }));
            setQuestions(mappedQuestions);
        } catch (error) {
            console.error('Error loading questions:', error);
            toast.error('Error al cargar las preguntas');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return;

        try {
            await api.delete(`/bonus/questions/${id}`);
            toast.success('Pregunta eliminada');
            loadQuestions();
        } catch (error) {
            console.error('Error deleting question:', error);
            toast.error('Error al eliminar la pregunta');
        }
    };

    const handleCreate = () => {
        setCreateDialogOpen(true);
    };

    const handleEdit = (question: BonusQuestion) => {
        setSelectedQuestion(question);
        setEditDialogOpen(true);
    };

    const handleGrade = (question: BonusQuestion) => {
        setSelectedQuestion(question);
        setGradeDialogOpen(true);
    };

    const handleSuccess = () => {
        loadQuestions();
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        setGradeDialogOpen(false);
        setSelectedQuestion(null);
    };

    // Filtrado
    const filteredQuestions = questions.filter(q =>
        q.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // SISTEMA DE DISEÑO BLINDADO
    const STYLES = {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '16px',
            paddingBottom: '100px',
            fontFamily: 'sans-serif'
        },
        headerRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
        },
        // BUSCADOR
        searchBox: {
            position: 'relative' as const,
            flex: 1,
            marginRight: '16px'
        },
        searchInput: {
            width: '100%',
            padding: '12px 16px 12px 44px',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '12px',
            color: 'white',
            outline: 'none',
            fontSize: '14px'
        },
        searchIcon: { position: 'absolute' as const, left: '14px', top: '14px', color: '#94A3B8' },
        createBtn: {
            backgroundColor: '#00E676',
            color: '#0F172A',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 230, 118, 0.2)'
        },

        // TARJETA DE PREGUNTA
        card: {
            backgroundColor: '#1E293B', // Carbon
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px',
            position: 'relative' as const,
            overflow: 'hidden',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        },
        // Encabezado Tarjeta (Puntos + Estado)
        cardTop: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
        },
        pointsBadge: {
            backgroundColor: 'rgba(250, 204, 21, 0.1)',
            border: '1px solid #FACC15',
            color: '#FACC15',
            padding: '4px 8px',
            borderRadius: '100px',
            fontSize: '10px',
            fontWeight: '900',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontFamily: "'Russo One', sans-serif"
        },
        statusBadge: {
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px'
        },
        // Cuerpo
        questionText: {
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            lineHeight: '1.4'
        },
        metaRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '11px',
            color: '#94A3B8',
            marginTop: '4px'
        },
        // Respuesta Correcta (Si existe)
        answerBox: {
            backgroundColor: 'rgba(0, 230, 118, 0.05)',
            border: '1px dashed #00E676',
            borderRadius: '8px',
            padding: '8px 12px',
            marginTop: '4px',
            display: 'flex', alignItems: 'center', gap: '8px'
        },
        answerLabel: { color: '#00E676', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' as const },
        answerValue: { color: 'white', fontWeight: 'bold', fontSize: '12px' },

        // Acciones
        actionsFooter: {
            display: 'flex',
            gap: '8px',
            marginTop: '8px',
            paddingTop: '12px',
            borderTop: '1px solid #334155'
        },
        actionBtn: {
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            textAlign: 'center' as const,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s'
        }
    };

    // Helper de Estado
    const getStatusConfig = (status: string | undefined) => {
        switch (status) {
            case 'OPEN': return { color: '#00E676', bg: 'rgba(0,230,118,0.1)', icon: <Clock size={12} />, label: 'Activa' };
            case 'CLOSED': return { color: '#FF1744', bg: 'rgba(255,23,68,0.1)', icon: <Lock size={12} />, label: 'Cerrada' };
            case 'GRADED': return { color: '#FACC15', bg: 'rgba(250,204,21,0.1)', icon: <Award size={12} />, label: 'Calificada' };
            case 'LOCKED': return { color: '#64748B', bg: 'rgba(100,116,139,0.1)', icon: <Shield size={12} />, label: 'Bloqueada' };
            default: return { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', icon: <HelpCircle size={12} />, label: 'Desconocido' };
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-signal" />
            </div>
        );
    }

    return (
        <div style={STYLES.container}>

            {/* HEADER: BUSCADOR + BOTÓN CREAR */}
            <div style={STYLES.headerRow}>
                <div style={STYLES.searchBox}>
                    <Search size={18} style={STYLES.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar pregunta..."
                        style={STYLES.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleCreate}
                    style={STYLES.createBtn}
                >
                    <Plus size={18} /> Crear Pregunta
                </button>
            </div>

            {/* LISTA DE PREGUNTAS */}
            {filteredQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>
                    <HelpCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    No se encontraron preguntas.
                </div>
            ) : (
                filteredQuestions.map(q => {
                    const statusConfig = getStatusConfig(q.status);

                    return (
                        <div key={q.id} style={STYLES.card}>

                            {/* Top Row: Puntos & Estado */}
                            <div style={STYLES.cardTop}>
                                <div style={STYLES.pointsBadge}>
                                    <Star size={10} fill="#FACC15" />
                                    {q.points} PTS
                                </div>
                                <div style={{
                                    ...STYLES.statusBadge,
                                    backgroundColor: statusConfig.bg,
                                    color: statusConfig.color
                                }}>
                                    {statusConfig.icon} {statusConfig.label}
                                </div>
                            </div>

                            {/* Pregunta */}
                            <h3 style={STYLES.questionText}>{q.text}</h3>

                            {/* Metadata */}
                            <div style={STYLES.metaRow}>
                                <span>ID: #{q.id.substring(0, 8)}</span>
                                <span>•</span>
                                <span>{q.responses} Respuestas</span>
                            </div>

                            {/* Respuesta Correcta (Solo si está calificada) */}
                            {q.correctAnswer && (
                                <div style={STYLES.answerBox}>
                                    <Award size={16} color="#00E676" />
                                    <div>
                                        <div style={STYLES.answerLabel}>Respuesta Correcta</div>
                                        <div style={STYLES.answerValue}>{q.correctAnswer}</div>
                                    </div>
                                </div>
                            )}

                            {/* Botones de Acción */}
                            <div style={STYLES.actionsFooter}>
                                {/* Si está abierta o cerrada, permite calificar */}
                                {q.status !== 'LOCKED' && q.status !== 'GRADED' && (
                                    <button
                                        onClick={() => handleGrade(q)}
                                        style={{
                                            ...STYLES.actionBtn,
                                            backgroundColor: '#00E676',
                                            borderColor: '#00E676',
                                            color: '#0F172A',
                                            boxShadow: '0 0 10px rgba(0,230,118,0.2)'
                                        }}
                                    >
                                        <Trophy size={14} /> Calificar
                                    </button>
                                )}

                                <button
                                    onClick={() => handleEdit(q)}
                                    style={{ ...STYLES.actionBtn, backgroundColor: 'transparent', borderColor: '#475569', color: '#F8FAFC' }}
                                >
                                    <Edit3 size={14} /> Editar
                                </button>

                                <button
                                    onClick={() => handleDelete(q.id)}
                                    style={{
                                        ...STYLES.actionBtn,
                                        backgroundColor: 'rgba(255,23,68,0.1)',
                                        borderColor: '#FF1744',
                                        color: '#FF1744',
                                        flex: 0.4
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                        </div>
                    );
                })
            )}

            {/* Dialogs */}
            <CreateQuestionDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={handleSuccess}
            />

            {selectedQuestion && (
                <>
                    <EditQuestionDialog
                        question={selectedQuestion}
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        onSuccess={handleSuccess}
                    />
                    <GradeQuestionDialog
                        question={selectedQuestion}
                        open={gradeDialogOpen}
                        onOpenChange={setGradeDialogOpen}
                        onSuccess={handleSuccess}
                    />
                </>
            )}

        </div>
    );
}