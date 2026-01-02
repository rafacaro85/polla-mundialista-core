
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ThumbsUp, Camera, Image as ImageIcon, Loader2, X, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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

export function SocialWallWidget({ leagueId, limit }: { leagueId: string, limit?: number }) {
    const { user } = useAppStore();
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
        fetchComments();
    }, [leagueId]);

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

            // Optimistic update or just re-fetch? Re-fetch is safer for relations
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
            const { data } = await api.patch(`/leagues/${leagueId}/comments/${commentId}/toggle-like`);
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
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl shadow-2xl w-full overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-slate-900/40 p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-500">
                        <MessageSquare size={18} />
                    </div>
                    <span className="font-russo uppercase tracking-widest text-sm text-white italic">MURO SOCIAL</span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {comments.length} Mensajes
                </div>
            </div>

            {/* Post Input */}
            <div className="p-4 bg-slate-800/20">
                <form onSubmit={handlePost} className="space-y-3">
                    <div className="flex gap-3">
                        <Avatar className="w-10 h-10 border border-slate-700">
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback className="bg-slate-800 text-xs">{user?.nickname?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={`¿Qué tienes en mente, ${user?.nickname?.split(' ')[0]}?`}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all min-h-[80px] resize-none"
                            />

                            {imagePreview && (
                                <div className="mt-2 relative inline-block group">
                                    <img src={imagePreview} className="max-h-40 rounded-xl border border-slate-700 object-cover" alt="Preview" />
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
                            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                        >
                            <Camera size={14} className="text-emerald-500" />
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
                            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-slate-900 font-black text-[10px] px-6 py-2 rounded-full flex items-center gap-2 transition-all uppercase tracking-[0.2em]"
                        >
                            {posting ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                            Publicar
                        </button>
                    </div>
                </form>
            </div>

            {/* Feed */}
            <div className={`overflow-y-auto custom-scrollbar p-4 space-y-6 ${limit ? 'max-h-[400px]' : 'h-[calc(100vh-280px)]'}`}>
                {loading ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                        <Loader2 className="animate-spin text-emerald-500" size={30} />
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
                            <Avatar className="w-9 h-9 border border-slate-700 shadow-lg">
                                <AvatarImage src={comment.user.avatarUrl} />
                                <AvatarFallback className="text-[10px] bg-slate-800 text-slate-400 font-bold">
                                    {comment.user.nickname?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="bg-slate-900/60 rounded-2xl rounded-tl-none p-3 border border-slate-700/30">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-xs font-black text-white hover:text-emerald-400 cursor-pointer transition-colors">
                                            {comment.user.nickname}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">{comment.content}</p>

                                    {comment.imageUrl && (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-700 shadow-2xl group cursor-zoom-in">
                                            <img src={comment.imageUrl} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" alt="Post" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 pl-1">
                                    <button
                                        onClick={() => handleLike(comment.id)}
                                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all ${comment.likes.includes(user?.id || '')
                                            ? 'text-emerald-400 scale-110'
                                            : 'text-slate-500 hover:text-white'
                                            }`}
                                    >
                                        <Heart size={14} fill={comment.likes.includes(user?.id || '') ? 'currentColor' : 'none'} />
                                        {comment.likes.length || 0}
                                    </button>
                                    <button className="text-[10px] font-bold text-slate-600 uppercase hover:text-white transition-colors tracking-tighter">
                                        Responder
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {comments.length > 0 && (
                <div className="bg-slate-900/40 p-3 text-center border-t border-slate-700/50">
                    <button
                        onClick={fetchComments}
                        className="text-[10px] font-black text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-[0.2em]"
                    >
                        Actualizar Muro
                    </button>
                </div>
            )}
        </div>
    );
}
