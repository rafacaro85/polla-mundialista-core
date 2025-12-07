"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateLeagueDialog } from './CreateLeagueDialog';
import { JoinLeagueDialog } from './JoinLeagueDialog';
import { useAppStore } from '@/store/useAppStore';

interface League {
    id: string;
    name: string;
    code: string;
    isAdmin: boolean;
}

interface LeagueSelectorProps {
    leagues: League[];
    onLeaguesUpdate: () => void;
}

export const LeagueSelector: React.FC<LeagueSelectorProps> = ({
    leagues,
    onLeaguesUpdate
}) => {
    // 🔥 Consumir store directamente
    const { selectedLeagueId, setSelectedLeague } = useAppStore();

    console.log('LeagueSelector - Pollas recibidas:', leagues);
    console.log('LeagueSelector - Liga seleccionada:', selectedLeagueId);

    return (
        <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
                <Select
                    value={selectedLeagueId || 'global'}
                    onValueChange={(value) => setSelectedLeague(value === 'global' ? 'global' : value)}
                >
                    <SelectTrigger className="flex-1 bg-carbon border-slate-600 text-white">
                        <SelectValue placeholder="Seleccionar Liga" />
                    </SelectTrigger>
                    <SelectContent className="bg-carbon border-slate-700 text-white">
                        <SelectItem value="global" className="text-signal font-bold">
                            🌍 Ranking Global
                        </SelectItem>
                        {leagues.map((league) => (
                            <SelectItem key={league.id} value={league.id}>
                                {league.isAdmin && '👑 '}{league.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <CreateLeagueDialog onLeagueCreated={onLeaguesUpdate} />
                <JoinLeagueDialog onLeagueJoined={onLeaguesUpdate} />
            </div>
        </div>
    );
};
