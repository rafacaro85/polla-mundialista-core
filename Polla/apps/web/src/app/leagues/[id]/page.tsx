'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, ChevronLeft, Trophy, Users, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface LeagueDetail {
    id: string;
    name: string;
    code: string;
    type: string;
    maxParticipants: number;
    creator: {
        id: string;
        nickname: string;
        avatarUrl?: string;
    };
    participantCount: number;
}

interface Participant {
    id: string;
    nickname: string;
    avatarUrl?: string;
    points: number;
    rank: number;
    user?: { // A veces viene anidado
        nickname: string;
        avatarUrl?: string;
    };
    totalPoints?: number; // A veces viene como totalPoints
}

export default function LeaguePage() {
    const params = useParams();
    const router = useRouter();
    const [league, setLeague] = useState<LeagueDetail | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            loadData(params.id as string);
        }
    }, [params.id]);

    const loadData = async (id: string) => {
        setLoading(true);
        try {
            // 1. Cargar Metadatos de la Liga
            // Como no tenemos endpoint de detalle único, buscamos en /leagues/all (Admin) o /leagues/my
            let leagueFound = null;

            try {
                const { data: allLeagues } = await api.get('/leagues/all');
                leagueFound = allLeagues.find((l: any) => l.id === id);
            } catch (e) {
                console.log('No es admin o falló /leagues/all, intentando /leagues/my');
                try {
                    const { data: myLeagues } = await api.get('/leagues/my');
                    leagueFound = myLeagues.find((l: any) => l.id === id);
                } catch (e2) {
                    console.error('Error buscando liga en mis ligas', e2);
                }
            }

            if (leagueFound) {
                setLeague(leagueFound);
            }

            // 2. Cargar Ranking (Participantes)
            const { data: rankingData } = await api.get(`/leagues/${id}/ranking`);

            // Mapear datos de ranking para normalizar estructura
            const mappedParticipants = Array.isArray(rankingData) ? rankingData.map((item: any, index: number) => ({
                id: item.id || item.user?.id,
                nickname: item.nickname || item.user?.nickname || 'Anónimo',
                avatarUrl: item.avatarUrl || item.user?.avatarUrl,
                points: item.totalPoints !== undefined ? item.totalPoints : item.points,
                rank: index + 1
            })) : [];

            setParticipants(mappedParticipants);

        } catch (error) {
            console.error('Error loading league data:', error);
            // toast.error('Error al cargar los datos de la liga');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-obsidian flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-signal" />
            </div>
        );
    }

    if (!league && participants.length === 0) {
        return (
            <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center text-white gap-4">
                <h1 className="text-2xl font-bold">Liga no encontrada</h1>
                <button
                    onClick={() => router.back()}
                    className="text-signal hover:underline flex items-center gap-2"
                >
                    <ChevronLeft size={20} /> Volver
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-obsidian text-white p-4 pb-24 font-sans">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-russo uppercase flex items-center gap-3">
                        {league?.name || 'Detalle de Liga'}
                        {league?.type === 'public' && <Shield className="text-yellow-500" size={24} />}
                    </h1>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                        <span className="flex items-center gap-1">
                            <Users size={14} /> {participants.length} / {league?.maxParticipants || '?'} Miembros
                        </span>
                        {league?.code && (
                            <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs">
                                CÓDIGO: {league.code}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Ranking Table */}
            <div className="bg-carbon rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
                    <Trophy className="text-signal" size={20} />
                    <h2 className="font-russo text-lg">Ranking de la Liga</h2>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-700 bg-black/20">
                            <TableHead className="w-16 text-center text-tactical">#</TableHead>
                            <TableHead className="text-tactical">Participante</TableHead>
                            <TableHead className="text-right text-tactical">Puntos</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {participants.sort((a, b) => a.rank - b.rank).map((participant) => (
                            <TableRow key={participant.id} className="border-slate-700 hover:bg-white/5">
                                <TableCell className="text-center font-bold font-mono text-lg">
                                    {participant.rank === 1 ? '🥇' :
                                        participant.rank === 2 ? '🥈' :
                                            participant.rank === 3 ? '🥉' : participant.rank}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-slate-600">
                                            {participant.avatarUrl ? (
                                                <AvatarImage src={participant.avatarUrl} />
                                            ) : (
                                                <AvatarFallback className="bg-slate-800 text-xs">
                                                    {participant.nickname.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white">{participant.nickname}</span>
                                            {league && participant.id === league.creator.id && (
                                                <span className="text-[10px] text-yellow-500 font-bold uppercase">Admin</span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-russo text-xl text-signal">
                                    {participant.points}
                                </TableCell>
                            </TableRow>
                        ))}
                        {participants.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                    Aún no hay participantes en esta liga.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
