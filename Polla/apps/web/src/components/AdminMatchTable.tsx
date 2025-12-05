'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EditMatchDialog } from './EditMatchDialog';
import { toast } from 'sonner';

interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    date: string;
}

export function AdminMatchTable() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchMatches = async () => {
        try {
            const { data } = await api.get('/matches');
            setMatches(data);
        } catch (error) {
            console.error('Error cargando partidos:', error);
            toast.error('Error al cargar partidos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    const handleManage = (match: Match) => {
        setSelectedMatch(match);
        setDialogOpen(true);
    };

    const handleMatchUpdated = () => {
        fetchMatches();
        setDialogOpen(false);
        setSelectedMatch(null);
    };

    if (loading) {
        return <p className="text-white">Cargando partidos...</p>;
    }

    return (
        <div className="bg-carbon rounded-lg p-6 border border-slate-700">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-700">
                        <TableHead className="text-signal font-russo">Fecha</TableHead>
                        <TableHead className="text-signal font-russo">Partido</TableHead>
                        <TableHead className="text-signal font-russo">Marcador</TableHead>
                        <TableHead className="text-signal font-russo">Estado</TableHead>
                        <TableHead className="text-signal font-russo">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {matches.map((match) => (
                        <TableRow key={match.id} className="border-slate-700">
                            <TableCell className="text-white">
                                {new Date(match.date).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </TableCell>
                            <TableCell className="text-white font-russo">
                                {match.homeTeam} vs {match.awayTeam}
                            </TableCell>
                            <TableCell className="text-white font-russo">
                                {match.homeScore !== null && match.awayScore !== null
                                    ? `${match.homeScore} - ${match.awayScore}`
                                    : '-'}
                            </TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${match.status === 'FINISHED' ? 'bg-green-600 text-white' :
                                        match.status === 'LIVE' ? 'bg-red-600 text-white' :
                                            'bg-slate-600 text-white'
                                    }`}>
                                    {match.status}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Button
                                    onClick={() => handleManage(match)}
                                    className="bg-signal text-obsidian hover:bg-signal/90 font-bold"
                                    size="sm"
                                >
                                    Gestionar
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {selectedMatch && (
                <EditMatchDialog
                    match={selectedMatch}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onMatchUpdated={handleMatchUpdated}
                />
            )}
        </div>
    );
}
