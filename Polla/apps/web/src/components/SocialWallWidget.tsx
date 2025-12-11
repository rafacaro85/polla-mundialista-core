
import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Comment {
    id: string;
    user: string;
    avatar?: string;
    text: string;
    time: string;
}

export function SocialWallWidget({ leagueId }: { leagueId: string }) {
    const [comments, setComments] = useState<Comment[]>([
        { id: '1', user: 'Carlos M.', text: '¡Vamos con toda este mundial! ⚽', time: '2h' },
        { id: '2', user: 'Ana R.', text: '¿Quién va ganando?', time: '4h' },
        { id: '3', user: 'Felipe T.', text: 'La polla está increíble.', time: '5h' },
    ]);
    const [newComment, setNewComment] = useState('');

    const handlePost = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        // Optimistic UI update
        const post: Comment = {
            id: Date.now().toString(),
            user: 'Tú',
            text: newComment,
            time: 'Justo ahora'
        };
        setComments([post, ...comments.slice(0, 2)]);
        setNewComment('');
    };

    return (
        <div className="bg-carbon border border-slate-700 rounded-xl p-4 shadow-lg w-full max-w-md">
            <div className="flex items-center gap-2 mb-4 text-brand-primary font-russo uppercase text-sm">
                <MessageSquare size={16} /> Muro del Equipo
            </div>

            {/* Input */}
            <form onSubmit={handlePost} className="relative mb-4">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe algo..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-full py-2 pl-4 pr-10 text-xs text-white focus:outline-none focus:border-brand-primary transition-colors"
                />
                <button
                    type="submit"
                    className="absolute right-1 top-1 p-1.5 bg-brand-primary rounded-full text-obsidian hover:opacity-90 transition-opacity"
                >
                    <Send size={12} />
                </button>
            </form>

            {/* Feed */}
            <div className="space-y-3">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 items-start">
                        <Avatar className="w-6 h-6 border border-slate-600">
                            <AvatarFallback className="text-[9px] bg-slate-800 text-slate-400">
                                {comment.user.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs font-bold text-white">{comment.user}</span>
                                <span className="text-[9px] text-slate-500">{comment.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-tight mt-0.5">{comment.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full text-[10px] text-center text-tactical mt-3 hover:text-brand-primary transition-colors uppercase font-bold">
                Ver todo el muro
            </button>
        </div>
    );
}
