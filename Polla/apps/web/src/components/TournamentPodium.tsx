'use client';

import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { getTeamFlagUrl } from '@/shared/utils/flags';

interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number | null;
    awayScore?: number | null;
    homeFlag?: string;
    awayFlag?: string;
    status?: string;
    phase?: string;
    [key: string]: any; // Allow other properties
}

interface PodiumProps {
    matches: Match[];
}

export const TournamentPodium: React.FC<PodiumProps> = ({ matches }) => {
    // Find Final and 3rd Place matches
    const finalMatch = matches.find(m => m.phase === 'FINAL');
    const thirdPlaceMatch = matches.find(m => m.phase === '3RD_PLACE');

    // Check if both matches are finished
    const isFinalFinished = finalMatch && finalMatch.status && ['FINISHED', 'COMPLETED', 'FINALIZADO'].includes(finalMatch.status);
    const isThirdPlaceFinished = thirdPlaceMatch && thirdPlaceMatch.status && ['FINISHED', 'COMPLETED', 'FINALIZADO'].includes(thirdPlaceMatch.status);

    // Don't show podium if matches aren't finished
    if (!isFinalFinished || !isThirdPlaceFinished) {
        return null;
    }

    // Determine winners
    const finalHomeScore = finalMatch.homeScore || 0;
    const finalAwayScore = finalMatch.awayScore || 0;
    const champion = finalHomeScore > finalAwayScore ? finalMatch.homeTeam : finalMatch.awayTeam;
    const championFlag = finalHomeScore > finalAwayScore ? finalMatch.homeFlag : finalMatch.awayFlag;
    const runnerUp = finalHomeScore > finalAwayScore ? finalMatch.awayTeam : finalMatch.homeTeam;
    const runnerUpFlag = finalHomeScore > finalAwayScore ? finalMatch.awayFlag : finalMatch.homeFlag;

    const thirdHomeScore = thirdPlaceMatch.homeScore || 0;
    const thirdAwayScore = thirdPlaceMatch.awayScore || 0;
    const thirdPlace = thirdHomeScore > thirdAwayScore ? thirdPlaceMatch.homeTeam : thirdPlaceMatch.awayTeam;
    const thirdPlaceFlag = thirdHomeScore > thirdAwayScore ? thirdPlaceMatch.homeFlag : thirdPlaceMatch.awayFlag;
    const fourthPlace = thirdHomeScore > thirdAwayScore ? thirdPlaceMatch.awayTeam : thirdPlaceMatch.homeTeam;
    const fourthPlaceFlag = thirdHomeScore > thirdAwayScore ? thirdPlaceMatch.awayFlag : thirdPlaceMatch.homeFlag;

    return (
        <div className="w-full max-w-4xl mx-auto my-8 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-yellow-500/30 shadow-2xl">
            {/* Title */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full shadow-lg">
                    <Trophy className="w-8 h-8 text-yellow-100" />
                    <h2 className="text-2xl font-black text-yellow-100 uppercase tracking-wider">
                        Podio Final
                    </h2>
                    <Trophy className="w-8 h-8 text-yellow-100" />
                </div>
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center gap-4 mb-8">
                {/* 2nd Place */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="relative mb-4">
                        <div className="absolute -top-2 -right-2 bg-slate-700 rounded-full p-2 border-2 border-slate-500 shadow-lg">
                            <Medal className="w-6 h-6 text-slate-300" />
                        </div>
                        <img 
                            src={getTeamFlagUrl(runnerUp || '')} 
                            alt={runnerUp}
                            className="w-20 h-20 rounded-full border-4 border-slate-500 shadow-xl object-cover"
                        />
                    </div>
                    <div className="w-full bg-gradient-to-b from-slate-600 to-slate-700 rounded-t-xl p-4 text-center border-t-4 border-slate-500 shadow-lg" style={{ height: '140px' }}>
                        <div className="text-5xl font-black text-slate-300 mb-2">2°</div>
                        <div className="text-sm font-bold text-slate-200 uppercase tracking-wide">{runnerUp}</div>
                        <div className="text-xs text-slate-400 mt-1">Subcampeón</div>
                    </div>
                </div>

                {/* 1st Place (Champion) */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="relative mb-4 animate-pulse">
                        <div className="absolute -top-3 -right-3 bg-yellow-500 rounded-full p-3 border-4 border-yellow-400 shadow-2xl">
                            <Trophy className="w-8 h-8 text-yellow-900" />
                        </div>
                        <img 
                            src={getTeamFlagUrl(champion || '')} 
                            alt={champion}
                            className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-2xl object-cover ring-4 ring-yellow-500/50"
                        />
                    </div>
                    <div className="w-full bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-t-xl p-6 text-center border-t-4 border-yellow-400 shadow-2xl" style={{ height: '180px' }}>
                        <div className="text-6xl font-black text-yellow-900 mb-2">1°</div>
                        <div className="text-base font-black text-yellow-900 uppercase tracking-wider">{champion}</div>
                        <div className="text-xs text-yellow-800 mt-2 font-bold">🏆 CAMPEÓN 🏆</div>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="relative mb-4">
                        <div className="absolute -top-2 -right-2 bg-amber-700 rounded-full p-2 border-2 border-amber-600 shadow-lg">
                            <Award className="w-6 h-6 text-amber-300" />
                        </div>
                        <img 
                            src={getTeamFlagUrl(thirdPlace || '')} 
                            alt={thirdPlace}
                            className="w-20 h-20 rounded-full border-4 border-amber-600 shadow-xl object-cover"
                        />
                    </div>
                    <div className="w-full bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-xl p-4 text-center border-t-4 border-amber-600 shadow-lg" style={{ height: '120px' }}>
                        <div className="text-5xl font-black text-amber-200 mb-2">3°</div>
                        <div className="text-sm font-bold text-amber-100 uppercase tracking-wide">{thirdPlace}</div>
                        <div className="text-xs text-amber-300 mt-1">Tercer Lugar</div>
                    </div>
                </div>
            </div>

            {/* 4th Place */}
            <div className="flex justify-center">
                <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <img 
                        src={getTeamFlagUrl(fourthPlace || '')} 
                        alt={fourthPlace}
                        className="w-10 h-10 rounded-full border-2 border-slate-600 object-cover"
                    />
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">4° Lugar</div>
                        <div className="text-sm font-bold text-slate-300">{fourthPlace}</div>
                    </div>
                </div>
            </div>

            {/* Confetti Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
                <div className="absolute top-0 left-3/4 w-2 h-2 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
            </div>
        </div>
    );
};
