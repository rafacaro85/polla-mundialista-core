"use client";

import React, { useState } from 'react';
import { Loader2, Trophy, X, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface GradeQuestionDialogProps {
    question: {
        id: string;
        text: string;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function GradeQuestionDialog({ question, open, onOpenChange, onSuccess }: GradeQuestionDialogProps) {
    const [loading, setLoading] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState('');

    if (!open || !question) return null;

    const handleSubmit = async () => {
        if (!correctAnswer.trim()) {
            toast.error('Debes ingresar una respuesta correcta');
            return;
        }

        if (!confirm('¿Estás seguro? Esta acción cerrará la pregunta y asignará puntos a los usuarios. No se puede deshacer fácilmente.')) {
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post(`/bonus/grade/${question.id}`, {
                correctAnswer
            });
            toast.success(`Pregunta calificada. ${data.updated} respuestas actualizadas.`);
            onSuccess();
            onOpenChange(false);
            setCorrectAnswer('');
        } catch (error: any) {
            console.error('Error grading question:', error);
            toast.error(error.response?.data?.message || 'Error al calificar la pregunta');
        } finally {
            setLoading(false);
        }
    };

    // SISTEMA DE DISEÑO BLINDADO
    const STYLES = {
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
        },
        card: {
            backgroundColor: '#1E293B', // Carbon
            width: '100%',
            maxWidth: '500px',
            borderRadius: '24px',
            border: '1px solid #334155',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column' as const,
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            position: 'relative' as const
        },

        // HEADER
        header: {
            padding: '24px',
            borderBottom: '1px solid #334155',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        iconBox: {
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#0F172A',
            border: '1px solid #FACC15', // Yellow for grading
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FACC15'
        },
        titleBox: {
            flex: 1
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            color: 'white',
            textTransform: 'uppercase' as const,
            fontSize: '18px',
            lineHeight: '1.2'
        },
        subtitle: {
            fontSize: '11px',
            color: '#94A3B8',
            marginTop: '2px'
        },
        closeBtn: {
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px'
        },

        // BODY
        body: {
            padding: '24px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '24px'
        },

        // WARNING BOX
        warningBox: {
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
        },
        warningText: {
            fontSize: '12px',
            color: '#FEF08A',
            lineHeight: '1.4'
        },

        // INPUTS
        inputGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px'
        },
        label: {
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#94A3B8',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px'
        },
        inputWrapper: {
            position: 'relative' as const,
            display: 'flex',
            alignItems: 'center'
        },
        input: {
            width: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '14px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            outline: 'none',
            fontFamily: 'sans-serif'
        },
        inputIcon: {
            position: 'absolute' as const,
            right: '16px',
            color: '#64748B'
        },

        // FOOTER
        footer: {
            padding: '20px 24px',
            borderTop: '1px solid #334155',
            display: 'flex',
            gap: '12px',
            backgroundColor: '#1E293B'
        },
        saveBtn: {
            flex: 1,
            backgroundColor: '#FACC15', // Yellow for grading action
            color: '#0F172A',
            border: 'none',
            padding: '14px',
            borderRadius: '12px',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '14px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 15px rgba(250, 204, 21, 0.3)'
        },
        cancelBtn: {
            flex: 1,
            backgroundColor: 'transparent',
            color: '#94A3B8',
            border: '1px solid #334155',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '12px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer'
        }
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.card}>

                {/* 1. HEADER */}
                <div style={STYLES.header}>
                    <div style={STYLES.iconBox}>
                        <Trophy size={20} />
                    </div>
                    <div style={STYLES.titleBox}>
                        <div style={STYLES.title}>Calificar Pregunta</div>
                        <div style={STYLES.subtitle}>Define la respuesta correcta para "{question.text}"</div>
                    </div>
                    <button onClick={() => onOpenChange(false)} style={STYLES.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                {/* 2. BODY */}
                <div style={STYLES.body}>

                    {/* Warning */}
                    <div style={STYLES.warningBox}>
                        <AlertTriangle size={20} color="#FACC15" style={{ flexShrink: 0 }} />
                        <p style={STYLES.warningText}>
                            Al calificar, la pregunta se cerrará automáticamente y se calcularán los puntos para todos los usuarios que hayan respondido exactamente igual (sin distinguir mayúsculas/minúsculas).
                        </p>
                    </div>

                    {/* Respuesta Correcta */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Respuesta Correcta</label>
                        <div style={STYLES.inputWrapper}>
                            <input
                                type="text"
                                value={correctAnswer}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                                placeholder="Ej: Lionel Messi"
                                style={STYLES.input}
                                autoFocus
                            />
                            <CheckCircle size={18} style={STYLES.inputIcon} />
                        </div>
                    </div>

                </div>

                {/* 3. FOOTER */}
                <div style={STYLES.footer}>
                    <button onClick={() => onOpenChange(false)} style={STYLES.cancelBtn}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={STYLES.saveBtn}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Trophy size={16} />}
                        Confirmar y Calificar
                    </button>
                </div>

            </div>
        </div>
    );
}
