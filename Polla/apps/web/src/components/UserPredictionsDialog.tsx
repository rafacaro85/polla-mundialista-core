import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Calendar, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserPredictionsDialogProps {
    leagueId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserPredictionsDialog({ leagueId, userId, userName, userAvatar, open, onOpenChange }: UserPredictionsDialogProps) {
    const [data, setData] = useState<{ predictions: any[], bonusAnswers: any[] } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && userId && leagueId) {
            loadData();
        }
    }, [open, userId, leagueId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/leagues/${leagueId}/participants/${userId}/details`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#0F172A] border-slate-700 text-white max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-slate-700 bg-[#1E293B]">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-emerald-500">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback>{userName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-xl font-bold font-russo uppercase">Detalle de Participante</DialogTitle>
                            <DialogDescription className="text-emerald-400 font-bold uppercase tracking-wider text-xs">
                                {userName}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : data ? (
                        <div className="space-y-8">
                            {/* --- PREDICCIONES DE PARTIDOS --- */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Pronósticos de Partidos ({data.predictions.length})
                                </h3>
                                <div className="space-y-3">
                                    {data.predictions.length === 0 && <p className="text-slate-500 text-sm italic">Sin pronósticos aún.</p>}
                                    {data.predictions.map((pred: any) => (
                                        <div key={pred.id} className="bg-[#1E293B] p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="text-[10px] text-slate-400 font-mono w-12 text-center">
                                                    {formatDate(pred.date)}
                                                </div>
                                                <div className="flex items-center gap-3 flex-1 justify-center">
                                                    <div className="text-right flex-1 font-bold text-sm">{pred.homeTeam}</div>
                                                    <div className="bg-slate-900 px-3 py-1 rounded border border-slate-600 font-mono font-bold text-emerald-400 min-w-[60px] text-center">
                                                        {pred.homeScore} - {pred.awayScore}
                                                    </div>
                                                    <div className="text-left flex-1 font-bold text-sm">{pred.awayTeam}</div>
                                                </div>
                                            </div>

                                            {pred.status === 'FINISHED' && (
                                                <div className="ml-4 flex flex-col items-end min-w-[60px]">
                                                    <span className={`text-xs font-bold ${pred.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {pred.points > 0 ? `+${pred.points} PTS` : '0 PTS'}
                                                    </span>
                                                    <span className="text-[9px] text-slate-500">
                                                        Real: {pred.matchScoreH ?? '-'} - {pred.matchScoreA ?? '-'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* --- BONUS --- */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                    <Trophy className="h-4 w-4" /> Preguntas Bonus ({data.bonusAnswers.length})
                                </h3>
                                <div className="space-y-3">
                                    {data.bonusAnswers.length === 0 && <p className="text-slate-500 text-sm italic">Sin respuestas bonus.</p>}
                                    {data.bonusAnswers.map((bonus: any) => (
                                        <div key={bonus.id} className="bg-[#1E293B] p-3 rounded-lg border border-slate-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-xs text-slate-300 font-bold">{bonus.questionText}</div>
                                                <div className={`text-xs font-bold px-2 py-0.5 rounded ${bonus.pointsEarned > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                                    {bonus.pointsEarned > 0 ? `+${bonus.pointsEarned}` : 'PENDIENTE'}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end text-xs">
                                                <div className="text-slate-400">
                                                    Respuesta: <span className="text-white font-bold">{bonus.answer}</span>
                                                </div>
                                                {bonus.pointsEarned > 0 && (
                                                    <div className="flex items-center gap-1 text-emerald-400">
                                                        <CheckCircle2 className="h-3 w-3" /> Correcto
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">No se encontraron datos.</div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
