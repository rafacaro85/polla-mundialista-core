import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Camera, X, Heart, Loader2, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Comment {
    id: string;
    content: string;
    imageUrl?: string;
    likes: string[];
    createdAt: string;
    user: {
        id: string;
        nickname: string;
        avatarUrl?: string;
    };
}

export function EnterpriseSocialWallWidget({ leagueId, limit, isLocked = false }: { leagueId: string, limit?: number, isLocked?: boolean }) {
    const { user } = useAppStore();
    const router = useRouter();
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayedComments = limit ? comments.slice(0, limit) : comments;

    useEffect(() => {
        if (!isLocked) fetchComments();
        else setLoading(false);
    }, [leagueId, isLocked]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/leagues/${leagueId}/comments`);
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() && !selectedImage) return;

        setPosting(true);
        try {
            let imageUrl = '';
            if (selectedImage) {
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('file', selectedImage);
                const uploadRes = await api.post('/upload', formData);
                imageUrl = uploadRes.data.url;
                setUploadingImage(false);
            }

            const { data } = await api.post(`/leagues/${leagueId}/comments`, {
                content: newComment,
                imageUrl
            });

            setComments([data, ...comments]);
            setNewComment('');
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo publicar el comentario', variant: 'destructive' });
        } finally {
            setPosting(false);
            setUploadingImage(false);
        }
    };

    const handleLike = async (commentId: string) => {
        try {
            await api.patch(`/leagues/${leagueId}/comments/${commentId}/toggle-like`);
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    const isLiked = c.likes.includes(user?.id || '');
                    const newLikes = isLiked
                        ? c.likes.filter(id => id !== user?.id)
                        : [...c.likes, user?.id || ''];
                    return { ...c, likes: newLikes };
                }
                return c;
            }));
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    return (
        <div className="bg-[var(--brand-card,#1E293B)] border border-white/5 rounded-2xl shadow-2xl w-full overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-black/20 p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-brand-primary/20 p-2 rounded-lg text-brand-primary">
                        <MessageSquare size={18} />
                    </div>
                    <span className="font-russo uppercase tracking-widest text-sm text-white italic">MURO SOCIAL</span>
                </div>
                {!isLocked && (
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {comments.length} Mensajes
                    </div>
                )}

            </div>

            <div className="relative">
                <div className={isLocked ? 'opacity-20 pointer-events-none grayscale blur-sm' : ''}>
                    {/* Post Input */}
                    <div className="p-4 bg-[var(--brand-card-highlight,rgba(255,255,255,0.02))]">
                        <form onSubmit={handlePost} className="space-y-3">
                            <div className="flex gap-3">
                                <Avatar className="w-10 h-10 border border-brand-primary/20">
                                    <AvatarImage src={user?.avatarUrl} />
                                    <AvatarFallback className="bg-brand-secondary text-xs font-bold text-brand-primary">{user?.nickname?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={`¿Qué tienes en mente, ${user?.nickname?.split(' ')[0]}?`}
                                        className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-primary/50 transition-all min-h-[80px] resize-none placeholder:text-slate-500"
                                    />

                                    {imagePreview && (
                                        <div className="mt-2 relative inline-block group">
                                            <img src={imagePreview} className="max-h-40 rounded-xl border border-white/10 object-cover" alt="Preview" />
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                            {uploadingImage && (
                                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                                    <Loader2 className="animate-spin text-white" size={20} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pl-12">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-brand-primary transition-colors uppercase tracking-widest"
                                >
                                    <Camera size={14} className="text-brand-primary" />
                                    {selectedImage ? 'Cambiar Foto' : 'Subir Imagen'}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                    />
                                </button>

                                <button
                                    type="submit"
                                    disabled={posting || (!newComment.trim() && !selectedImage)}
                                    className="bg-brand-primary hover:bg-brand-primary/80 text-[var(--brand-bg,#000)] font-black text-[10px] px-6 py-2 rounded-full flex items-center gap-2 transition-all uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {posting ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                                    Publicar
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Feed */}
                    <div className={`overflow-y-auto custom-scrollbar p-4 space-y-6 ${limit ? 'max-h-[500px]' : 'h-[calc(100vh-280px)]'}`}>
                        {loading ? (
                            <div className="flex flex-col items-center py-10 gap-3">
                                <Loader2 className="animate-spin text-brand-primary" size={30} />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cargando Muro...</p>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-10">
                                <MessageSquare size={40} className="mx-auto text-slate-700 mb-3 opacity-20" />
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                    No hay mensajes aún.<br />¡Sé el primero en publicar!
                                </p>
                            </div>
                        ) : (
                            displayedComments.map(comment => (
                                <div key={comment.id} className="flex gap-3 items-start animate-in slide-in-from-bottom-2 duration-300">
                                    <Avatar className="w-9 h-9 border border-brand-primary/20 shadow-lg">
                                        <AvatarImage src={comment.user.avatarUrl} />
                                        <AvatarFallback className="text-[10px] bg-brand-secondary text-brand-primary font-bold">
                                            {comment.user.nickname?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <div className="bg-black/20 rounded-2xl rounded-tl-none p-3 border border-white/5">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-xs font-black text-white hover:text-brand-primary cursor-pointer transition-colors">
                                                    {comment.user.nickname}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase">
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                                            {comment.imageUrl && (
                                                <div className="mt-3 rounded-xl overflow-hidden border border-white/10 shadow-2xl group cursor-zoom-in">
                                                    <img src={comment.imageUrl} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" alt="Post" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 pl-1">
                                            <button
                                                onClick={() => handleLike(comment.id)}
                                                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all ${comment.likes.includes(user?.id || '')
                                                    ? 'text-brand-primary scale-110'
                                                    : 'text-slate-500 hover:text-white'
                                                    }`}
                                            >
                                                <Heart size={14} fill={comment.likes.includes(user?.id || '') ? 'currentColor' : 'none'} />
                                                {comment.likes.length || 0}
                                            </button>
                                            {/* <button className="text-[10px] font-bold text-slate-600 uppercase hover:text-white transition-colors tracking-tighter">
                                                Responder
                                            </button> */}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {isLocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl border border-white/5 p-6 text-center z-10">
                        <div className="bg-amber-500/20 p-3 rounded-full mb-3">
                            <Lock className="text-amber-500" size={24} />
                        </div>
                        <h4 className="text-white font-black text-sm uppercase mb-1">Muro Desactivado</h4>
                        <p className="text-slate-400 text-[10px] max-w-[200px] leading-relaxed">
                            El muro social no está disponible en esta liga.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            {comments.length > limit! && !isLocked && (
                <div className="bg-black/20 p-3 text-center border-t border-white/5">
                    <button
                        onClick={() => router.push(`/leagues/${leagueId}/wall`)}
                        className="text-[10px] font-black text-slate-500 hover:text-brand-primary transition-colors uppercase tracking-[0.2em]"
                    >
                        Ver todos los mensajes
                    </button>
                </div>
            )}
        </div>
    );
}
