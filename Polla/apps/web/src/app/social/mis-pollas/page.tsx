"use client";

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Trophy, 
  ChevronRight, 
  ShieldCheck, 
  LogOut, 
  Search,
  Users,
  Timer,
  ExternalLink,
  ChevronLeft,
  Share2,
  MoreVertical,
  LayoutDashboard,
  BarChart3,
  Settings,
  LogIn,
  Trash2
} from 'lucide-react';
import { useLeagues } from '@/hooks/useLeagues';
import { useAppStore } from '@/store/useAppStore';
import { JoinLeagueDialog } from '@/components/JoinLeagueDialog';
import { CreateLeagueDialog } from '@/components/CreateLeagueDialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { MoneyCard } from '@/components/MoneyCard';
import { MainHeader } from '@/components/MainHeader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import api from '@/lib/api';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.472-1.761-1.645-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

function MisPollasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAppStore();
  const { socialLeagues, loading, fetchLeagues } = useLeagues();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleShare = (league: any) => {
    const code = league.accessCodePrefix || league.code;
    const shareUrl = `${window.location.origin}/invite/${code}`;
    const message = `¡Hola! Te invito a mi Polla 🏆 *${league.name}*.\n\nÚnete súper fácil dando clic directo aquí:\n👉 ${shareUrl}\n\nO también puedes ingresar a la plataforma y usar el código: *${code}*`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredLeagues = socialLeagues.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      // Clean up URL without reload
      router.replace('/social/mis-pollas', { scroll: false });
    }
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-russo uppercase tracking-widest text-xs animate-pulse">Cargando tus pollas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] font-sans flex flex-col pb-20">
      
      <MainHeader />

      {/* Header Premium */}
      <header className="px-6 py-8 flex flex-col gap-6 relative z-10">
        <div className="flex items-center justify-between">
            <Link href="/gateway" className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} className="text-slate-400" />
            </Link>
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#00E676]/10 border border-[#00E676]/20 flex items-center justify-center">
                    <Trophy size={20} className="text-[#00E676]" />
                </div>
                <span className="text-white font-russo text-2xl tracking-tighter uppercase italic">Mis Pollas</span>
            </div>
            <div className="w-10"></div> {/* Spacer for symmetry */}
        </div>


        {/* Acciones Rápidas */}
        <div className="flex gap-3">
             <button 
                onClick={() => setIsCreateModalOpen(true)} 
                className="flex-1 bg-[#00E676] text-[#050505] p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_rgba(0,230,118,0.2)]"
             >
                <Plus size={18} strokeWidth={3} /> Crear Polla
             </button>
             
             <JoinLeagueDialog onLeagueJoined={fetchLeagues}>
                <button className="flex-1 bg-white/5 border border-white/10 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-all">
                    <Search size={18} /> Código
                </button>
             </JoinLeagueDialog>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 px-6 relative z-10">
        
        {/* Barra de búsqueda si hay pollas */}
        {socialLeagues.length > 0 && (
            <div className="mb-6 relative">
                 <input 
                    type="text" 
                    placeholder="Buscar polla..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-4 pl-10 text-sm focus:outline-none focus:border-[#00E676]/50 transition-colors text-white"
                 />
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
        )}

        {filteredLeagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeagues.map((league) => (
              <div 
                key={league.id} 
                className={`group relative bg-[#1E293B] border rounded-[2rem] overflow-hidden flex flex-col p-5 transition-all duration-500 shadow-xl ${
                    league.status === 'PENDING'
                    ? 'border-red-500/50 hover:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
                    : league.status === 'REJECTED'
                    ? 'border-red-600 hover:border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.15)]'
                    : 'border-white/5 hover:border-[#00E676]/30'
                }`}
              >
                <div className="absolute top-6 right-6 pointer-events-none group-hover:scale-110 transition-transform duration-500 z-10">
                    {(() => {
                        const tid = (league as any).tournamentId || (league as any).tournament_id || (league.name.toLowerCase().includes('champions') ? 'UCL2526' : '');
                        if (!tid) return null;
                        
                        const isUCL = tid === 'UCL2526';
                        return (
                            <img 
                                src={isUCL ? '/images/ucl-logo.png' : '/images/wc-logo.png'} 
                                alt="Tournament" 
                                className={`h-16 w-auto object-contain ${isUCL ? 'brightness-0 invert' : ''} drop-shadow-2xl`}
                            />
                        );
                    })()}
                </div>

                {/* Imagen del Premio / MoneyCard / Fondo por defecto */}
                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 bg-[#0F172A]">
                    {league.prizeType === 'cash' && league.prizeAmount != null ? (
                        <MoneyCard amount={Number(league.prizeAmount)} variant="full" />
                    ) : league.prizeImageUrl ? (
                        <img 
                            src={league.prizeImageUrl} 
                            alt={league.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 opacity-20">
                            <Trophy size={40} className="text-slate-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">{league.name}</span>
                        </div>
                    )}
                </div>

                {/* Info de la Polla */}
                <div className="flex flex-col gap-1 mb-6">
                    <h3 className="text-lg font-russo text-white tracking-tight truncate leading-none uppercase">
                        {league.name}
                    </h3>
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                            <Users size={12} className="text-[#00E676]" /> {league.members} Jugadores
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                                <ShieldCheck size={12} className="text-[#00E676]" /> {league.admin === 'Tú' ? 'Eries Admin' : `De: ${league.admin}`}
                            </span>
                            {league.status === 'PENDING' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/leagues/${league.id}`);
                                    }}
                                    className="h-8 px-3 rounded-md text-[10px] font-extrabold uppercase border border-yellow-500/50 cursor-pointer flex items-center justify-center bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-[#0F172A] transition-all"
                                >
                                    PENDIENTE
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botón de Ingreso o Menú de Admin */}
                {league.admin === 'Tú' ? (
                  <div className="flex items-stretch gap-2">
                    {/* INGRESAR: navega directo, no abre menú */}
                    <button
                      onClick={() => router.push(`/leagues/${league.id}`)}
                      className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest bg-[#00E676] text-[#050505] hover:bg-[#00C853] transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)]"
                    >
                      <LogIn size={15} />
                      Ingresar
                    </button>

                    {/* WhatsApp Group Share - ONLY FOR ADMIN AND ACTIVE LEAGUES */}
                    {league.code && league.status !== 'PENDING' && league.status !== 'REJECTED' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShare(league);
                            }}
                            className="w-[52px] h-[52px] flex items-center justify-center rounded-xl bg-[#25D366] text-white hover:bg-[#128C7E] transition-all shrink-0 hover:scale-105 shadow-lg shadow-[#25D366]/20"
                            title="Compartir enlace de invitación"
                        >
                            <WhatsAppIcon className="w-6 h-6" />
                        </button>
                    )}

                    {/* ⋮ solo este botón abre el dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="relative px-4 py-4 rounded-2xl bg-[#00E676] text-[#050505] hover:bg-[#00C853] transition-all shadow-lg shadow-[#00E676]/10 flex items-center justify-center shrink-0">
                          <MoreVertical size={18} strokeWidth={2.5} />
                          {league.pendingRequestsCount != null && league.pendingRequestsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-[#1E293B] animate-bounce">
                              {league.pendingRequestsCount}
                            </span>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1E293B] border-white/10 text-white w-56 p-2 rounded-2xl shadow-2xl z-[100]" align="end" side="top">
                              <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] px-2 py-1.5">Acciones de la Polla</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/5" />
                              
                              <DropdownMenuItem asChild className="focus:bg-[#00E676] focus:text-[#0F172A] rounded-xl cursor-pointer py-3">
                                  <Link href={`/leagues/${league.id}/admin/users`} className="flex items-center gap-3 w-full justify-between">
                                      <div className="flex items-center gap-3">
                                          <Users size={16} /> <span className="font-bold">PARTICIPANTES</span>
                                      </div>
                                      {league.pendingRequestsCount != null && league.pendingRequestsCount > 0 && (
                                          <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                                              {league.pendingRequestsCount}
                                          </span>
                                      )}
                                  </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild className="focus:bg-[#00E676] focus:text-[#0F172A] rounded-xl cursor-pointer py-3">
                                  <Link href={`/leagues/${league.id}/admin`} className="flex items-center gap-3 w-full">
                                      <Settings size={16} /> <span className="font-bold">PANEL DE CONTROL</span>
                                  </Link>
                              </DropdownMenuItem>

                              {league.status === 'REJECTED' && (
                                  <>
                                      <DropdownMenuSeparator className="bg-white/5" />
                                      <DropdownMenuItem 
                                          onClick={async () => {
                                              if (!confirm('¿Eliminar esta liga?')) return;
                                              try {
                                                  await api.delete(`/leagues/${league.id}`);
                                                  window.location.reload();
                                              } catch (err) {
                                                  console.error('Error deleting league', err);
                                                  alert('Error al eliminar la liga');
                                              }
                                          }}
                                          className="focus:bg-red-500 focus:text-white text-red-400 rounded-xl cursor-pointer py-3 flex items-center gap-3"
                                      >
                                          <Trash2 size={16} /> <span className="font-bold">ELIMINAR</span>
                                      </DropdownMenuItem>
                                  </>
                              )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                ) : (
                  <div className="flex items-stretch gap-2">
                      <button 
                          onClick={() => router.push(`/leagues/${league.id}`)}
                          className={`flex-1 flex gap-2 justify-center items-center py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                              league.status === 'PENDING' 
                              ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500 hover:text-[#050505]' 
                              : league.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
                              : 'bg-white/5 border border-white/10 text-white hover:bg-[#00E676] hover:text-[#050505] hover:border-[#00E676]'
                          }`}
                      >
                          {league.status === 'PENDING' ? (
                              league.admin === 'Tú' ? (
                                  league.hasPendingTransaction ? (
                                      <>Validando Pago <ChevronRight size={16} /></>
                                  ) : (
                                      <>Pagar para Activar <ChevronRight size={16} /></>
                                  )
                              ) : (
                                  <>Pendiente de Activación <ChevronRight size={16} /></>
                              )
                          ) : league.status === 'REJECTED' ? (
                              <>Reintentar Pago <ChevronRight size={16} /></>
                          ) : (
                              <>Ingresar <ChevronRight size={16} /></>
                          )}
                      </button>

                      {league.status !== 'PENDING' && league.status !== 'REJECTED' && league.code && (
                          <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(league);
                              }}
                              className="w-[52px] h-[52px] flex items-center justify-center rounded-xl bg-[#25D366] text-white hover:bg-[#128C7E] transition-all shrink-0 hover:scale-105 shadow-lg shadow-[#25D366]/20"
                              title="Compartir enlace de invitación"
                          >
                              <WhatsAppIcon className="w-6 h-6" />
                          </button>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-6 text-slate-700">
                <Trophy size={40} />
            </div>
            <h2 className="text-xl font-russo text-white mb-2 uppercase italic">Aún no tienes pollas</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
               Únete a la polla de tus amigos o crea la tuya para empezar a predecir.
            </p>
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#00E676] text-[#050505] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#00E676]/10"
            >
                Empezar ahora
            </button>
          </div>
        )}

      </main>

      {/* Cómo Funciona — para nuevos jugadores */}
      <HowItWorksSection />

      {/* Fondo Glow Distorsionado */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[80vw] h-[80vw] bg-[#00E676] rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-5"></div>
      </div>
      <CreateLeagueDialog 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onLeagueCreated={fetchLeagues}
      />
    </div>
  );
}

export default function MisPollasSociales() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-russo uppercase tracking-widest text-xs animate-pulse">Cargando...</p>
      </div>
    }>
      <MisPollasContent />
    </Suspense>
  );
}

