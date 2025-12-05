import React from 'react';
import { X } from 'lucide-react';

interface MatchInfoSheetProps {
    match: any;
    onClose: () => void;
}

export default function MatchInfoSheet({ match, onClose }: MatchInfoSheetProps) {
    if (!match) return null;

    // Mock H2H data - 3 enfrentamientos históricos
    const h2hData = [
        {
            tournament: 'Mundial 2014',
            date: '23 Jun 2014',
            result: 'NED 2-0 CHI',
            score: { home: 2, away: 0 }
        },
        {
            tournament: 'Amistoso 2016',
            date: '15 Nov 2016',
            result: 'CHI 1-1 NED',
            score: { home: 1, away: 1 }
        },
        {
            tournament: 'Copa América 2019',
            date: '28 Jun 2019',
            result: 'CHI 0-0 NED',
            score: { home: 0, away: 0 }
        }
    ];

    const homeTeam = match.homeTeam?.code || match.home || 'LOC';
    const awayTeam = match.awayTeam?.code || match.away || 'VIS';

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center">
                <div
                    className="bg-carbon rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl border border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-700">
                        <div>
                            <h2 className="text-xl font-russo text-signal">HEAD TO HEAD</h2>
                            <p className="text-sm text-tactical mt-1">
                                {homeTeam} vs {awayTeam}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-tactical" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        <div className="space-y-4">
                            {h2hData.map((h2h, index) => (
                                <div
                                    key={index}
                                    className="bg-obsidian rounded-xl p-4 border border-slate-700 hover:border-signal/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-signal uppercase tracking-wider">
                                            {h2h.tournament}
                                        </span>
                                        <span className="text-xs text-tactical">
                                            {h2h.date}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="text-center flex-1">
                                            <div className="text-2xl font-russo text-white">
                                                {h2h.result.split(' ')[0]}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
                                            <span className="text-2xl font-russo text-signal">
                                                {h2h.score.home}
                                            </span>
                                            <span className="text-tactical font-bold">-</span>
                                            <span className="text-2xl font-russo text-signal">
                                                {h2h.score.away}
                                            </span>
                                        </div>
                                        <div className="text-center flex-1">
                                            <div className="text-2xl font-russo text-white">
                                                {h2h.result.split(' ')[2]}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stats Summary */}
                        <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-obsidian rounded-xl border border-slate-700">
                            <div className="text-center">
                                <div className="text-2xl font-russo text-signal">1</div>
                                <div className="text-xs text-tactical uppercase mt-1">Victorias {homeTeam}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-russo text-gold">2</div>
                                <div className="text-xs text-tactical uppercase mt-1">Empates</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-russo text-signal">0</div>
                                <div className="text-xs text-tactical uppercase mt-1">Victorias {awayTeam}</div>
                            </div>
                        </div>

                        {/* Note */}
                        <p className="text-xs text-tactical text-center mt-4 italic">
                            * Datos históricos de ejemplo
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
