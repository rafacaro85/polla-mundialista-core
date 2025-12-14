'use client';

import React from 'react';
import { MessageSquare, Send, Heart, User } from 'lucide-react';

/**
 * Wall Page - Muro Social de Comentarios (Enterprise Only)
 * 
 * Página de muro social donde los participantes de una polla empresarial
 * pueden compartir comentarios, reacciones y mensajes.
 */
export default function WallPage() {
    return (
        <div className="min-h-screen bg-brand-bg text-brand-text p-4 md:p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-russo uppercase text-brand-primary">
                        Muro Social
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Comparte tus comentarios y reacciones con otros participantes
                    </p>
                </div>

                {/* Coming Soon Message */}
                <div className="bg-brand-secondary border border-brand-primary/20 rounded-2xl p-8 text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-brand-primary/10 flex items-center justify-center">
                        <MessageSquare size={40} className="text-brand-primary" />
                    </div>

                    <h2 className="text-2xl font-bold">Próximamente</h2>

                    <p className="text-slate-400 max-w-md mx-auto">
                        El muro social está en desarrollo. Pronto podrás compartir comentarios,
                        reacciones y conectar con otros participantes de tu polla empresarial.
                    </p>

                    <div className="pt-4 space-y-2">
                        <p className="text-sm font-bold text-brand-primary">Funcionalidades próximas:</p>
                        <ul className="text-sm text-slate-400 space-y-1">
                            <li>✓ Publicar comentarios y actualizaciones</li>
                            <li>✓ Reaccionar a publicaciones</li>
                            <li>✓ Mencionar a otros participantes</li>
                            <li>✓ Compartir predicciones destacadas</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
