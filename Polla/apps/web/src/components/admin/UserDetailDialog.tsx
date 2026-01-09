
"use client";

import React, { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import api from '@/lib/api';
import { Loader2, Calendar, Trophy, Zap, Star, LayoutGrid, Award, Shield, X, Edit2, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserDetailDialogProps {
    userId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface UserDetails {
    user: {
        id: string;
        fullName: string;
        email: string;
        avatarUrl?: string;
        role: string;
        createdAt: string;
        nickname?: string;
    };

    leagues: {
        leagueId: string;
        leagueName: string;
        leagueCode?: string;
        isBlocked: boolean;
        stats: {
            totalPoints: number;
            predictionPoints: number;
            triviaPoints: number;
            bracketPoints: number;
            jokerPoints: number;
        }
    }[];
    globalStats: {
        totalPoints: number;
        predictionPoints: number;
        triviaPoints: number;
        bracketPoints: number;
        jokerPoints: number;
    };
}

export function UserDetailDialog({ userId, open, onOpenChange }: UserDetailDialogProps) {
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<UserDetails | null>(null);
    const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>({});

    useEffect(() => {
        if (open && userId) {
            loadDetails();
            setEditingLeagueId(null);
        } else {
            setDetails(null);
            setEditingLeagueId(null);
        }
    }, [open, userId]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/users/${userId}/details`);
            setDetails(data);
        } catch (error) {
            console.error('Error loading details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditStart = (leagueId: string, stats: any) => {
        setEditingLeagueId(leagueId);
        setEditValues({
            totalPoints: stats.totalPoints,
            triviaPoints: stats.triviaPoints,
            predictionPoints: stats.predictionPoints,
            bracketPoints: stats.bracketPoints,
            jokerPoints: stats.jokerPoints
        });
    };

    const handleSaveStats = async (leagueId: string) => {
        try {
            await api.patch(`/leagues/${leagueId}/participants/${userId}/score`, editValues);
            await loadDetails();
            setEditingLeagueId(null);
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    if (!open) return null;

    const STYLES = {
        card: "bg-[#1E293B] border border-slate-700/50 rounded-xl overflow-hidden",
        header: "p-6 bg-[#0F172A] border-b border-slate-700",
        avatar: "h-20 w-20 border-4 border-[#0F172A] shadow-xl rounded-full",
        name: "text-xl font-bold text-white mt-2",
        email: "text-sm text-slate-400 font-mono",
        roleBadge: "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ml-2 align-middle",
        sectionTitle: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2",
        statGrid: "grid grid-cols-2 sm:grid-cols-3 gap-3",
        statBox: "bg-[#0F172A]/50 border border-slate-700/50 rounded-lg p-3 flex flex-col items-center justify-center text-center",
        statLabel: "text-[10px] text-slate-400 uppercase font-bold mt-1",
        statValue: "text-lg font-russo text-white",
        leagueCard: "mb-4 border border-slate-700 rounded-xl bg-[#0F172A]/30 overflow-hidden"
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1E293B] border-slate-700 text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50 bg-black/20 p-1 text-white">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                        <p className="text-slate-400 text-sm animate-pulse">Cargando perfil táctico...</p>
                    </div>
                ) : details ? (
                    <>
                        {/* HEADER PROFILE */}
                        <div className="relative">
                            <div className="h-24 bg-gradient-to-r from-emerald-900/50 to-slate-900/50 absolute w-full top-0 left-0 z-0" />
                            <div className="p-6 relative z-10 pt-10">
                                <div className="flex items-start justify-between">
                                    <div className='flex items-end gap-4'>
                                        <Avatar className="h-20 w-20 border-4 border-[#1E293B] shadow-xl">
                                            <AvatarImage src={details.user.avatarUrl} />
                                            <AvatarFallback className="bg-slate-800 text-2xl font-bold text-slate-500">
                                                {details.user.fullName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="mb-2">
                                            <h2 className="text-xl font-bold text-white flex items-center">
                                                {details.user.fullName}
                                                <span className={`${STYLES.roleBadge} ${details.user.role === 'SUPER_ADMIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    details.user.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        'bg-slate-700/30 text-slate-400 border-slate-600'
                                                    }`}>
                                                    {details.user.role}
                                                </span>
                                            </h2>
                                            <p className="text-sm text-slate-400 font-mono">{details.user.email}</p>
                                            {details.user.nickname && (
                                                <p className="text-xs text-emerald-500 font-bold">@{details.user.nickname}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700 text-right">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-end gap-1 mb-1">
                                            <Calendar size={12} /> Registro
                                        </div>
                                        <div className="text-xs font-mono text-white">
                                            {new Date(details.user.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                            {new Date(details.user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BODY */}
                        <div className="p-6 space-y-6">

                            {/* GLOBAL STATS */}
                            {details.globalStats && (
                                <div className={`${STYLES.leagueCard} border-emerald-500/30 bg-emerald-500/5`}>
                                    <div className="px-4 py-3 bg-emerald-900/20 border-b border-emerald-500/20 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                                                <Shield size={16} /> ESTADÍSTICAS GLOBALES
                                            </h4>
                                            <p className="text-[10px] text-emerald-500/60 font-mono">ACUMULADO TOTAL DE TODAS LAS LIGAS</p>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className={STYLES.statGrid}>
                                            {/* TOTAL */}
                                            <div className={`${STYLES.statBox} bg-emerald-500/10 border-emerald-500/30 col-span-2 sm:col-span-1`}>
                                                <Trophy size={18} className="text-emerald-400 mb-1" />
                                                <div className="text-xl font-black text-emerald-400 font-russo">{details.globalStats.totalPoints}</div>
                                                <div className={STYLES.statLabel}>Puntos Globales</div>
                                            </div>

                                            {/* PREDICTION PTS */}
                                            <div className={STYLES.statBox}>
                                                <LayoutGrid size={16} className="text-emerald-400 mb-1" />
                                                <div className={STYLES.statValue}>{details.globalStats.predictionPoints}</div>
                                                <div className={STYLES.statLabel}>Resultados</div>
                                            </div>

                                            {/* TRIVIA */}
                                            <div className={STYLES.statBox}>
                                                <Zap size={16} className="text-amber-400 mb-1" />
                                                <div className={STYLES.statValue}>{details.globalStats.triviaPoints}</div>
                                                <div className={STYLES.statLabel}>Bonus Trivia</div>
                                            </div>

                                            {/* BRACKET */}
                                            <div className={STYLES.statBox}>
                                                <Award size={16} className="text-purple-400 mb-1" />
                                                <div className={STYLES.statValue}>{details.globalStats.bracketPoints}</div>
                                                <div className={STYLES.statLabel}>Fases Finales</div>
                                            </div>

                                            {/* JOKER */}
                                            <div className={STYLES.statBox}>
                                                <Star size={16} className="text-pink-400 mb-1" />
                                                <div className={STYLES.statValue}>{details.globalStats.jokerPoints}</div>
                                                <div className={STYLES.statLabel}>Joker (Comodín)</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LIGAS */}
                            <div>
                                <h3 className={STYLES.sectionTitle}><Trophy size={14} className="text-amber-400" /> Participación en Pollas</h3>

                                {details.leagues.length === 0 ? (
                                    <div className="text-center p-8 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                                        <Trophy size={32} className="mx-auto text-slate-700 mb-2" />
                                        <p className="text-sm text-slate-500">El usuario no participa en ninguna polla.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {details.leagues.map((league) => (
                                            <div key={league.leagueId} className={STYLES.leagueCard}>
                                                <div className="px-4 py-3 bg-[#0F172A] border-b border-slate-700/50 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">{league.leagueName}</h4>
                                                        {league.leagueCode && <p className="text-[10px] text-slate-500 font-mono">CODE: {league.leagueCode}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {league.isBlocked && (
                                                            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase">
                                                                Bloqueado en Polla
                                                            </span>
                                                        )}
                                                        {/* EDIT BUTTONS */}
                                                        {editingLeagueId === league.leagueId ? (
                                                            <div className="flex items-center gap-1">
                                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-500 hover:text-emerald-400" onClick={() => handleSaveStats(league.leagueId)}>
                                                                    <Check size={14} />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-400" onClick={() => setEditingLeagueId(null)}>
                                                                    <X size={14} />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-white" onClick={() => handleEditStart(league.leagueId, league.stats)}>
                                                                <Edit2 size={12} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-4">
                                                    <div className={STYLES.statGrid}>
                                                        {/* TOTAL */}
                                                        <div className={`${STYLES.statBox} bg-indigo-500/5 border-indigo-500/20 col-span-2 sm:col-span-1`}>
                                                            <Trophy size={18} className="text-indigo-400 mb-1" />
                                                            {editingLeagueId === league.leagueId ? (
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 w-24 bg-slate-900 border-indigo-500/50 text-center text-white font-bold mx-auto ring-0 focus-visible:ring-1 focus-visible:ring-indigo-500"
                                                                    value={editValues.totalPoints}
                                                                    onChange={(e) => setEditValues({ ...editValues, totalPoints: e.target.value === '' ? '' : Number(e.target.value) })}
                                                                />
                                                            ) : (
                                                                <div className="text-xl font-black text-indigo-400 font-russo">{league.stats.totalPoints}</div>
                                                            )}
                                                            <div className={STYLES.statLabel}>Puntos Totales</div>
                                                        </div>

                                                        {/* PREDICTION PTS */}
                                                        <div className={STYLES.statBox}>
                                                            <LayoutGrid size={16} className="text-emerald-400 mb-1" />
                                                            {editingLeagueId === league.leagueId ? (
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 w-20 bg-slate-900 border-emerald-500/50 text-center text-white font-bold mx-auto ring-0 focus-visible:ring-1 focus-visible:ring-emerald-500"
                                                                    value={editValues.predictionPoints}
                                                                    onChange={(e) => setEditValues({ ...editValues, predictionPoints: e.target.value === '' ? '' : Number(e.target.value) })}
                                                                />
                                                            ) : (
                                                                <div className={STYLES.statValue}>{league.stats.predictionPoints}</div>
                                                            )}
                                                            <div className={STYLES.statLabel}>Resultados</div>
                                                        </div>

                                                        {/* TRIVIA */}
                                                        <div className={STYLES.statBox}>
                                                            <Zap size={16} className="text-amber-400 mb-1" />
                                                            {editingLeagueId === league.leagueId ? (
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 w-20 bg-slate-900 border-amber-500/50 text-center text-white font-bold mx-auto ring-0 focus-visible:ring-1 focus-visible:ring-amber-500"
                                                                    value={editValues.triviaPoints}
                                                                    onChange={(e) => setEditValues({ ...editValues, triviaPoints: e.target.value === '' ? '' : Number(e.target.value) })}
                                                                />
                                                            ) : (
                                                                <div className={STYLES.statValue}>{league.stats.triviaPoints}</div>
                                                            )}
                                                            <div className={STYLES.statLabel}>Bonus Trivia</div>
                                                        </div>

                                                        {/* BRACKET */}
                                                        <div className={STYLES.statBox}>
                                                            <Award size={16} className="text-purple-400 mb-1" />
                                                            {editingLeagueId === league.leagueId ? (
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 w-20 bg-slate-900 border-purple-500/50 text-center text-white font-bold mx-auto ring-0 focus-visible:ring-1 focus-visible:ring-purple-500"
                                                                    value={editValues.bracketPoints}
                                                                    onChange={(e) => setEditValues({ ...editValues, bracketPoints: e.target.value === '' ? '' : Number(e.target.value) })}
                                                                />
                                                            ) : (
                                                                <div className={STYLES.statValue}>{league.stats.bracketPoints}</div>
                                                            )}
                                                            <div className={STYLES.statLabel}>Fases Finales</div>
                                                        </div>

                                                        {/* JOKER */}
                                                        <div className={STYLES.statBox}>
                                                            <Star size={16} className="text-pink-400 mb-1" />
                                                            {editingLeagueId === league.leagueId ? (
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 w-20 bg-slate-900 border-pink-500/50 text-center text-white font-bold mx-auto ring-0 focus-visible:ring-1 focus-visible:ring-pink-500"
                                                                    value={editValues.jokerPoints}
                                                                    onChange={(e) => setEditValues({ ...editValues, jokerPoints: e.target.value === '' ? '' : Number(e.target.value) })}
                                                                />
                                                            ) : (
                                                                <div className={STYLES.statValue}>{league.stats.jokerPoints}</div>
                                                            )}
                                                            <div className={STYLES.statLabel}>Joker (Comodín)</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-500">No se pudo cargar la información del usuario.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
