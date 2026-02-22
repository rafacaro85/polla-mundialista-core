'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { Trophy, Users, Copy, Share2, Clock, Target, TrendingUp, AlertTriangle, CheckCircle2, Zap, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MoneyCard } from '@/components/MoneyCard';
import { UserStatusBlock } from '@/components/UserStatusBlock';

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
  const [copied, setCopied] = useState(false);


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
          BLOQUE 0 — HERO (Welcome Banner)
          ═══════════════════════════════════════════════ */}
      <div className="px-4">
        <div className="relative h-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white/5">
          <img 
            src={currentLeague?.brandCoverUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000'} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            alt="Hero" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col items-start gap-4">
            <p className="text-[#00E676] text-xs font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-2">
              ¡HOLA, {user?.nickname?.toUpperCase() || 'CRACK'}!
            </p>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white leading-[0.85] tracking-tighter">
              ¡BIENVENIDO A LA <br /> 
              <span className="text-[#00E676]">POLLA {currentLeague?.name?.toUpperCase()}!</span>
            </h2>
            <p className="text-slate-200 text-sm md:text-lg max-w-lg leading-relaxed font-medium drop-shadow-lg">
              {currentLeague?.welcomeMessage || 'Únete a la emoción del fútbol. ¡Pronostica, compite y gana premios exclusivos con tus amigos y familiares!'}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 w-full">
              <button
                onClick={() => onNavigate('predictions')}
                className="bg-[#00E676] text-[#0F172A] px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(0,230,118,0.3)] hover:scale-105 hover:translate-y-[-1px] active:scale-95 transition-all flex items-center gap-3"
              >
                <PlayCircle size={22} fill="currentColor" /> INGRESAR A JUGAR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          BLOQUE 1 — Estado inteligente del jugador
          ═══════════════════════════════════════════════ */}
      <div className="px-4">
        <UserStatusBlock 
          currentLeagueId={currentLeague?.id || ''}
          matches={matches}
          onNavigate={onNavigate}
        />
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
