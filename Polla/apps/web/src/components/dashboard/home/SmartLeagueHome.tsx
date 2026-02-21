'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { Trophy, Users, Copy, Share2, Clock, Target, TrendingUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { MoneyCard } from '@/components/MoneyCard';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  displayDate?: string;
  status: 'SCHEDULED' | 'FINISHED' | 'LIVE';
  userPrediction?: any;
  prediction?: any;
  homeFlag?: string;
  awayFlag?: string;
}

interface CurrentLeague {
  id: string;
  name: string;
  code?: string;
  prizeImageUrl?: string;
  prizeType?: string;
  prizeAmount?: number;
  prizeDetails?: string;
  participantCount?: number;
  maxParticipants?: number;
  [key: string]: any;
}

interface SmartLeagueHomeProps {
  currentLeague: CurrentLeague | null;
  matches: Match[];
  onNavigate: (tab: 'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus') => void;
}

export function SmartLeagueHome({ currentLeague, matches, onNavigate }: SmartLeagueHomeProps) {
  const { user } = useAppStore();
  const [rankingPos, setRankingPos] = useState<number | null>(null);
  const [rankingTotal, setRankingTotal] = useState<number | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch ranking to get user position
  useEffect(() => {
    if (!currentLeague?.id || !user?.id) {
      setLoadingRanking(false);
      return;
    }

    const fetchRanking = async () => {
      try {
        const { data } = await api.get(`/leagues/${currentLeague.id}/ranking`);
        const list: any[] = Array.isArray(data) ? data : (data?.ranking || data?.participants || []);
        setRankingTotal(list.length);
        const myEntry = list.find((p: any) => p.userId === user.id || p.user?.id === user.id);
        if (myEntry) {
          setRankingPos(myEntry.position ?? (list.indexOf(myEntry) + 1));
          setUserPoints(myEntry.totalPoints ?? myEntry.points ?? 0);
        }
      } catch {
        // Silently ignore ranking fetch errors
      } finally {
        setLoadingRanking(false);
      }
    };

    fetchRanking();
  }, [currentLeague?.id, user?.id]);

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

  // Invitation handlers
  const shareUrl = typeof window !== 'undefined' && currentLeague?.code
    ? `${window.location.origin}/leagues/join?code=${currentLeague.code}`
    : '';

  const handleWhatsApp = () => {
    if (!currentLeague || !shareUrl) return;
    const msg = `¡Hola! Te invito a unirte a mi polla *${currentLeague.name.toUpperCase()}* en La Polla Virtual. 🏆\n\nUsa este enlace para unirte: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success('¡Enlace copiado!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-5 pb-24">

      {/* ═══════════════════════════════════════════════
          BLOQUE 1 — Estado inteligente del jugador
          ═══════════════════════════════════════════════ */}
      <div className="px-4">
        <div className="relative bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/5 rounded-3xl p-5 overflow-hidden">
          {/* Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#00E676]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Saludo */}
          <div className="mb-4">
            <p className="text-[#00E676] text-[10px] font-black uppercase tracking-[0.3em] mb-1">¡Hola, {user?.nickname || 'Crack'}!</p>
            <h2 className="text-2xl font-russo text-white uppercase tracking-tight leading-none">Tu estado</h2>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Posición */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
              {loadingRanking ? (
                <div className="h-6 bg-white/10 animate-pulse rounded-lg w-2/3" />
              ) : rankingPos ? (
                <>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <TrendingUp size={10} className="text-[#00E676]" /> Posición
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
                  <p className="text-2xl font-russo text-[#00E676]">
                    {userPoints ?? 0} <span className="text-slate-600 text-sm font-medium">pts</span>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Próximo partido */}
          {liveMatch ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">En Vivo Ahora</p>
                <p className="text-white text-sm font-bold">{liveMatch.homeTeam} vs {liveMatch.awayTeam}</p>
              </div>
              <span className="text-red-400 text-[10px] font-black uppercase bg-red-500/20 px-2 py-1 rounded-full animate-pulse">🔴 LIVE</span>
            </div>
          ) : (nextUnpredicted || !allPredicted) ? (
            <div className={`border rounded-2xl p-4 flex flex-col gap-3 ${isClosingSoon ? 'bg-[#FACC15]/10 border-[#FACC15]/40' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target size={14} className={isClosingSoon ? 'text-[#FACC15]' : 'text-[#00E676]'} />
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
                  className={`shrink-0 px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isClosingSoon ? 'bg-[#FACC15] text-[#0F172A] hover:bg-yellow-400' : 'bg-[#00E676] text-[#0F172A] hover:bg-[#00c868]'}`}
                >
                  IR A PREDECIR →
                </button>
              </div>
            </div>
          ) : allPredicted ? (
            <div className="bg-[#00E676]/10 border border-[#00E676]/20 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-[#00E676] shrink-0" />
              <div>
                <p className="text-[#00E676] text-xs font-black uppercase tracking-wide">¡Al día!</p>
                <p className="text-slate-400 text-xs">Tienes todas las predicciones al día 🎯</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          BLOQUE 2 — Premio Mayor
          ═══════════════════════════════════════════════ */}
      {(currentLeague?.prizeType === 'cash'
        ? currentLeague?.prizeAmount != null
        : !!(currentLeague?.prizeImageUrl || currentLeague?.prizeDetails)
      ) && (
        <div className="px-4">
          <div className="bg-[#1E293B] border border-white/5 rounded-3xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <Trophy size={14} className="text-[#00E676]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Premio Mayor</h3>
            </div>

            {currentLeague?.prizeType === 'cash' && currentLeague?.prizeAmount != null ? (
              /* ── MoneyCard ── */
              <div className="px-4 pb-4">
                <MoneyCard amount={Number(currentLeague.prizeAmount)} />
              </div>
            ) : currentLeague?.prizeImageUrl ? (
              /* ── Imagen ── */
              <img
                src={currentLeague.prizeImageUrl}
                alt="Premio"
                className="w-full h-40 object-cover"
              />
            ) : (
              /* ── Placeholder ── */
              <div className="mx-4 mb-4 h-32 bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-white/5 rounded-2xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 opacity-25">
                  <Trophy size={32} className="text-[#00E676]" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Premio</span>
                </div>
              </div>
            )}
            {currentLeague?.prizeDetails && (
              <p className="px-4 pb-4 text-sm text-white font-medium leading-relaxed">{currentLeague.prizeDetails}</p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          BLOQUE 3 — Invitación
          ═══════════════════════════════════════════════ */}
      {currentLeague?.code && (
        <div className="px-4">
          <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-[#00E676]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Invitar Amigos</h3>
              </div>
              {currentLeague.participantCount != null && currentLeague.maxParticipants != null && (
                <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                  {currentLeague.participantCount} / {currentLeague.maxParticipants} jugadores
                </span>
              )}
            </div>

            {/* Código */}
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">Código de invitación</p>
                <p className="text-xl font-russo text-[#00E676] tracking-widest">{currentLeague.code}</p>
              </div>
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl bg-white/5 hover:bg-[#00E676] hover:text-[#0F172A] text-slate-400 transition-all"
                title="Copiar código"
              >
                <Copy size={16} />
              </button>
            </div>

            {/* Botones */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/25 hover:bg-[#25D366] hover:text-white font-black text-xs uppercase tracking-widest transition-all"
              >
                <Share2 size={14} /> WhatsApp
              </button>
              <button
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
                  copied
                    ? 'bg-[#00E676] text-[#0F172A] border-[#00E676]'
                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <Copy size={14} /> {copied ? '¡Copiado!' : 'Copiar link'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
