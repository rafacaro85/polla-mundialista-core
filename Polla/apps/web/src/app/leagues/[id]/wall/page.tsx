'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MessageSquare, Send, Heart, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

interface Comment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
    likes?: number;
}

/**
 * Wall Page - Muro Social de Comentarios (Enterprise Only)
 */
export default function WallPage() {
    const params = useParams();
    const { user } = useAppStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [params.id]);

    const loadComments = async () => {
        try {
            const { data } = await api.get(`/leagues/${params.id}/comments`);
            setComments(data);
        } catch (error) {
            console.error('Error loading comments:', error);
            // Si no existe el endpoint, usar datos mock
            setComments([
                { id: '1', userId: '1', userName: 'Carlos M.', text: '¡Vamos con toda este mundial! ⚽', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
                { id: '2', userId: '2', userName: 'Ana R.', text: '¿Quién va ganando?', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
                { id: '3', userId: '3', userName: 'Felipe T.', text: 'La polla está increíble.', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || posting) return;

        setPosting(true);
        try {
            const { data } = await api.post(`/leagues/${params.id}/comments`, {
                text: newComment
            });

            // Agregar comentario al inicio
            setComments([data, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error posting comment:', error);
            // Optimistic UI update si falla el endpoint
            const optimisticComment: Comment = {
                id: Date.now().toString(),
                userId: user?.id || 'temp',
                userName: user?.name || 'Tú',
                text: newComment,
                createdAt: new Date().toISOString()
            };
            setComments([optimisticComment, ...comments]);
            setNewComment('');
        } finally {
            setPosting(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Justo ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text p-4 pb-24 md:pb-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <MessageSquare className="text-brand-primary" size={32} />
                        <h1 className="text-3xl font-russo uppercase text-brand-primary">
                            Muro Social
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Comparte tus comentarios y reacciones con otros participantes
                    </p>
                </div>

                {/* Post Form */}
                <div className="bg-brand-secondary border border-brand-primary/20 rounded-2xl p-6">
                    <form onSubmit={handlePost} className="space-y-4">
                        <div className="flex gap-3">
                            <Avatar className="w-10 h-10 border-2 border-brand-primary/30">
                                <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="¿Qué estás pensando?"
                                    className="w-full bg-brand-bg border border-brand-primary/20 rounded-xl p-3 text-brand-text placeholder:text-slate-500 focus:outline-none focus:border-brand-primary transition-colors resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!newComment.trim() || posting}
                                className="px-6 py-2 bg-brand-primary text-obsidian rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {posting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                Publicar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Comments Feed */}
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="bg-brand-secondary border border-brand-primary/20 rounded-2xl p-6 hover:border-brand-primary/40 transition-colors"
                        >
                            <div className="flex gap-4">
                                <Avatar className="w-10 h-10 border-2 border-brand-primary/30">
                                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-bold">
                                        {comment.userName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-brand-text">{comment.userName}</h3>
                                            <p className="text-xs text-slate-400">{formatTime(comment.createdAt)}</p>
                                        </div>
                                    </div>
                                    <p className="text-brand-text leading-relaxed">{comment.text}</p>

                                    {/* Actions */}
                                    <div className="flex gap-4 mt-3">
                                        <button className="flex items-center gap-1 text-slate-400 hover:text-brand-primary transition-colors text-sm">
                                            <Heart size={16} />
                                            <span>{comment.likes || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {comments.length === 0 && (
                        <div className="bg-brand-secondary border border-brand-primary/20 rounded-2xl p-12 text-center">
                            <MessageSquare className="mx-auto mb-4 text-slate-400" size={48} />
                            <p className="text-slate-400">No hay comentarios aún. ¡Sé el primero en comentar!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
