'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { Clock, Target, TrendingUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  displayDate?: string;
  status: 'SCHEDULED' | 'FINISHED' | 'LIVE' | 'PENDING';
  userPrediction?: any;
  prediction?: any;
  homeFlag?: string;
  awayFlag?: string;
}

interface UserStatusBlockProps {
  currentLeagueId: string;
  matches: Match[];
  onNavigate: (tab: any) => void;
  className?: string;
  variant?: 'full' | 'side';
}

export function UserStatusBlock({ currentLeagueId, matches, onNavigate, className = "", variant = 'full' }: UserStatusBlockProps) {
  const { user } = useAppStore();
  const [rankingPos, setRankingPos] = useState<number | null>(null);
  const [rankingTotal, setRankingTotal] = useState<number | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(true);


  // Fetch ranking to get user position
  useEffect(() => {
    if (!currentLeagueId || !user?.id) {
      setLoadingRanking(false);
      return;
    }

    const fetchRanking = async () => {
      try {
        const { data } = await api.get(`/leagues/${currentLeagueId}/ranking`);
        const list: any[] = Array.isArray(data) ? data : (data?.ranking || data?.participants || []);
        setRankingTotal(list.length);
        const myEntry = list.find((p: any) => p.userId === user.id || p.user?.id === user.id || p.id === user.id);
        if (myEntry) {
          setRankingPos((myEntry.rank || myEntry.position) ?? (list.indexOf(myEntry) + 1));
          setUserPoints(myEntry.totalPoints ?? myEntry.points ?? 0);
        }
      } catch (err) {
        console.error('Error fetching ranking for status block:', err);
      } finally {
        setLoadingRanking(false);
      }
    };

    fetchRanking();
  }, [currentLeagueId, user?.id]);

  // Find next unpredicted scheduled/pending match
  const now = new Date();
  const nextUnpredicted = matches
    .filter(m => (m.status === 'SCHEDULED' || m.status === 'PENDING') && !m.userPrediction && !m.prediction)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const liveMatch = matches.find(m => m.status === 'LIVE');

  const allPredicted = matches
    .filter(m => (m.status === 'SCHEDULED' || m.status === 'PENDING'))
    .every(m => m.userPrediction || m.prediction);

  const isClosingSoon = nextUnpredicted
    ? (new Date(nextUnpredicted.date).getTime() - now.getTime()) < 60 * 60 * 1000
    : false;

  const nickname = (user?.nickname || user?.fullName?.split(' ')[0] || 'Crack');

  return (
    <div className={`relative bg-[var(--brand-secondary,#1E293B)] border border-white/5 rounded-3xl p-5 overflow-hidden ${className}`}>
      {/* Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-primary,#00E676)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Saludo */}
      <div className="mb-4">
        <p className="text-[var(--brand-primary,#00E676)] text-[10px] font-black uppercase tracking-[0.3em] mb-1">¡Hola, {nickname}!</p>
        <h2 className="text-2xl font-russo text-white uppercase tracking-tight leading-none">Tu estado</h2>
      </div>

      {/* Stats Row */}
      <div className={`grid gap-3 mb-5 ${variant === 'side' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Posición */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
          {loadingRanking ? (
            <div className="h-6 bg-white/10 animate-pulse rounded-lg w-2/3" />
          ) : rankingPos ? (
            <>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <TrendingUp size={10} className="text-[var(--brand-primary,#00E676)]" /> Posición
              </p>
              <p className="text-2xl font-russo text-white">
                #{rankingPos}
                <span className="text-slate-600 text-sm font-medium"> / {rankingTotal}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Posición</p>
              <p className="text-sm text-slate-600 font-bold">Sin partidos</p>
            </>
          )}
        </div>

        {/* Puntos */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
          {loadingRanking ? (
            <div className="h-6 bg-white/10 animate-pulse rounded-lg w-1/2" />
          ) : (
            <>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <Zap size={10} className="text-[#FACC15]" /> Puntos
              </p>
              <p className="text-2xl font-russo text-[var(--brand-primary,#00E676)]">
                {userPoints ?? 0} <span className="text-slate-600 text-sm font-medium">pts</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Próximo partido */}
      {liveMatch ? (
        <div className="bg-[var(--brand-primary,#00E676)]/10 border border-[var(--brand-primary,#00E676)]/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-[var(--brand-primary,#00E676)] rounded-full animate-pulse shrink-0" />
          <div className="flex-1">
            <p className="text-[var(--brand-primary,#00E676)] text-[10px] font-black uppercase tracking-widest mb-1">En Vivo Ahora</p>
            <p className="text-white text-sm font-bold">{liveMatch.homeTeam} vs {liveMatch.awayTeam}</p>
          </div>
          <span className="text-[var(--brand-primary,#00E676)] text-[10px] font-black uppercase bg-[var(--brand-primary,#00E676)]/20 px-2 py-1 rounded-full animate-pulse">🔴 LIVE</span>
        </div>
      ) : (nextUnpredicted || !allPredicted) ? (
        <div className={`border rounded-2xl p-4 flex flex-col gap-3 ${isClosingSoon ? 'bg-[#FACC15]/10 border-[#FACC15]/40' : 'bg-white/5 border-white/5'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target size={14} className={isClosingSoon ? 'text-[#FACC15]' : 'text-[var(--brand-primary,#00E676)]'} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${isClosingSoon ? 'text-[#FACC15]' : 'text-slate-400'}`}>
                {nextUnpredicted ? 'Próximo sin predecir' : 'Pendientes por llenar'}
              </p>
            </div>
            {isClosingSoon && (
              <div className="flex items-center gap-1 bg-[#FACC15]/20 text-[#FACC15] px-2 py-0.5 rounded-full animate-pulse">
                <AlertTriangle size={9} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-wider">¡CIERRA PRONTO!</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              {nextUnpredicted ? (
                <>
                  <p className="text-white text-base font-russo uppercase tracking-tight">
                    {nextUnpredicted.homeTeam} <span className="text-slate-500 font-medium">vs</span> {nextUnpredicted.awayTeam}
                  </p>
                  <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                    <Clock size={9} /> {nextUnpredicted.displayDate || new Date(nextUnpredicted.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              ) : (
                <p className="text-white text-sm font-medium">Tienes predicciones pendientes</p>
              )}
            </div>
            <button
              onClick={() => onNavigate('predictions')}
              className={`shrink-0 px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isClosingSoon ? 'bg-[#FACC15] text-[#0F172A] hover:bg-yellow-400' : 'bg-[var(--brand-primary,#00E676)] text-[#0F172A] hover:bg-opacity-80'}`}
            >
              IR A PREDECIR →
            </button>
          </div>
        </div>
      ) : allPredicted ? (
        <div className="bg-[var(--brand-primary,#00E676)]/10 border border-[var(--brand-primary,#00E676)]/20 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-[var(--brand-primary,#00E676)] shrink-0" />
          <div>
            <p className="text-[var(--brand-primary,#00E676)] text-xs font-black uppercase tracking-wide">¡Al día!</p>
            <p className="text-slate-400 text-xs">Tienes todas las predicciones al día 🎯</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
