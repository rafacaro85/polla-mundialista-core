"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Save, X, HelpCircle, Edit3 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface EditQuestionDialogProps {
    question: {
        id: string;
        text: string;
        points: number;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditQuestionDialog({ question, open, onOpenChange, onSuccess }: EditQuestionDialogProps) {
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState('');
    const [points, setPoints] = useState('10');

    useEffect(() => {
        if (question) {
            setText(question.text);
            setPoints(question.points.toString());
        }
    }, [question, open]);

    if (!open || !question) return null;

    const handleSubmit = async () => {
        if (!text.trim()) {
            toast.error('La pregunta no puede estar vacía');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/bonus/questions/${question.id}`, {
                text,
                points: parseInt(points) || 0
            });
            toast.success('Pregunta actualizada exitosamente');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating question:', error);
            toast.error('Error al actualizar la pregunta');
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
            border: '1px solid #00E676',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00E676'
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
            backgroundColor: '#00E676',
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
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.3)'
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
                        <Edit3 size={20} />
                    </div>
                    <div style={STYLES.titleBox}>
                        <div style={STYLES.title}>Editar Pregunta</div>
                        <div style={STYLES.subtitle}>Modifica los detalles de la pregunta bonus</div>
                    </div>
                    <button onClick={() => onOpenChange(false)} style={STYLES.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                {/* 2. BODY */}
                <div style={STYLES.body}>

                    {/* Pregunta */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Pregunta</label>
                        <div style={STYLES.inputWrapper}>
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Ej: ¿Quién será el goleador?"
                                style={STYLES.input}
                                autoFocus
                            />
                            <HelpCircle size={18} style={STYLES.inputIcon} />
                        </div>
                    </div>

                    {/* Puntos */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Puntos</label>
                        <div style={STYLES.inputWrapper}>
                            <input
                                type="number"
                                value={points}
                                onChange={(e) => setPoints(e.target.value)}
                                style={STYLES.input}
                                min={1}
                            />
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
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Guardar Cambios
                    </button>
                </div>

            </div>
        </div>
    );
}
