"use client";

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Building2, ChevronLeft, Plus, LogIn, Settings2,
    Users, CheckCircle2, Clock, XCircle, Trophy, Loader2,
    ShieldCheck, Briefcase, Trash2,  MoreVertical,
  LayoutDashboard,
  Settings,
  LogOut,
  BarChart3,
  MessageCircle
} from 'lucide-react';
import { useLeagues } from '@/hooks/useLeagues';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { MainHeader } from '@/components/MainHeader';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.472-1.761-1.645-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function StatusBadge({ league }: { league: any }) {
    if (league.isEnterpriseActive) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20">
                <CheckCircle2 size={10} /> Activa
            </span>
        );
    }
    
    if (league.status === 'REJECTED') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                <XCircle size={10} /> Rechazado
            </span>
        );
    }

    if (league.isPaid) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Clock size={10} /> Validando
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
            <Clock size={10} /> Pendiente Pago
        </span>
    );
}

function PlanTag({ packageType }: { packageType?: string }) {
    if (!packageType) return null;
    const t = packageType.toUpperCase();
    let label = packageType;
    let color = 'text-slate-400 border-slate-600/30 bg-slate-700/30';

    if (t.includes('DIAMOND')) { label = 'Diamond'; color = 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10'; }
    else if (t.includes('PLATINUM')) { label = 'Platinum'; color = 'text-violet-300 border-violet-500/30 bg-violet-500/10'; }
    else if (t.includes('GOLD')) { label = 'Gold'; color = 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10'; }
    else if (t.includes('SILVER')) { label = 'Silver'; color = 'text-slate-300 border-slate-400/30 bg-slate-500/10'; }
    else if (t.includes('BRONZE')) { label = 'Bronze'; color = 'text-orange-300 border-orange-500/30 bg-orange-500/10'; }
    else if (t.includes('INFLUENCER') || t.includes('ELITE')) { label = 'Influencer'; color = 'text-pink-300 border-pink-500/30 bg-pink-500/10'; }
    else if (t.includes('STARTER')) { label = 'Starter'; color = 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'; }

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${color}`}>
            <Trophy size={8} /> {label}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Enterprise League Card                                               */
/* ------------------------------------------------------------------ */
function EnterpriseLeagueCard({ league }: { league: any }) {
    const displayName = league.name;
    const companyName = league.companyName && league.companyName !== league.name
        ? league.companyName
        : null;

    return (
        <div className={`group relative bg-[#1E293B] border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(0,230,118,0.08)] ${
            !league.isEnterpriseActive 
            ? 'border-red-500/50 hover:border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.05)]' 
            : 'border-[#334155] hover:border-[#00E676]/40'
        }`}>
            {/* Top strip accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-[#00E676]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Header row */}
            <div className="flex items-start gap-3">
                {/* Icon / Brand Logo */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${
                    !league.brandingLogoUrl ? 'bg-[#00E676]/10 border border-[#00E676]/20' : 'bg-white'
                }`}>
                    {league.brandingLogoUrl ? (
                        <img 
                            src={league.brandingLogoUrl} 
                            alt={league.companyName || league.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Building2 size={24} className="text-[#00E676]" />
                    )}
                </div>

                <div className="absolute top-2 right-2">
                    <img 
                        src={(league.tournamentId || '').toUpperCase().includes('UCL') ? '/images/ucl-logo.png' : '/images/wc-logo.png'} 
                        alt="Tournament" 
                        className={`h-10 w-auto object-contain opacity-90 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110 ${(league.tournamentId || '').toUpperCase().includes('UCL') ? 'brightness-0 invert' : ''}`}
                    />
                </div>

                {/* Names */}
                <div className="flex-1 min-w-0">
                    {/* Company Name (if different from league name) */}
                    {companyName && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Briefcase size={10} className="text-slate-500 shrink-0" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
                                {companyName}
                            </p>
                        </div>
                    )}
                    {/* League / Tournament Name */}
                    <h3 className="text-white font-black text-base leading-tight truncate uppercase tracking-tight">
                        {displayName}
                    </h3>

                    {/* Badges row */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <StatusBadge league={league} />
                        <PlanTag packageType={league.packageType} />
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                    <Users size={12} />
                    <span>{league.members ?? 0} / {league.maxParticipants} participantes</span>
                </span>
                {league.isAdmin && (
                    <span className="flex items-center gap-1.5 text-[#00E676]">
                        <ShieldCheck size={12} />
                        <span className="font-bold uppercase tracking-wider text-[9px]">Admin</span>
                    </span>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-auto">
                {league.isAdmin ? (
                    <div className="flex items-stretch gap-2 flex-1">
                        {/* INGRESAR: navega directo, no abre menú */}
                        <Link
                            href={`/leagues/${league.id}`}
                            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#00E676] text-[#0F172A] font-black uppercase tracking-widest text-[11px] hover:bg-[#00C853] transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)]"
                        >
                            <LogIn size={15} />
                            Ingresar
                        </Link>

                        {/* WhatsApp Group Share */}
                        {(league.accessCodePrefix || league.code) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const code = league.accessCodePrefix || league.code;
                                    const shareUrl = `${window.location.origin}/invite/${code}`;
                                    const msg = `Te invito a ${league.name.toUpperCase()}. Únete aquí: ${shareUrl}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
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
                                <button className="relative px-4 py-4 rounded-xl bg-[#00E676] text-[#0F172A] hover:bg-[#00C853] transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)] flex items-center justify-center shrink-0">
                                    <MoreVertical size={16} strokeWidth={2.5} />
                                    {league.pendingRequestsCount != null && league.pendingRequestsCount > 0 && (
                                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border-2 border-[#1E293B] animate-bounce">
                                        {league.pendingRequestsCount}
                                      </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1E293B] border-white/10 text-white w-56 p-2 rounded-2xl shadow-2xl z-[100]" align="end" side="top">
                                <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] px-2 py-1.5">Acciones Disponibles</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                
                                <DropdownMenuItem asChild className="focus:bg-[#00E676] focus:text-[#0F172A] rounded-xl cursor-pointer py-3">
                                    <Link href={`/leagues/${league.id}/studio`} className="flex items-center gap-3 w-full">
                                        <LayoutDashboard size={16} /> <span className="font-bold">ESTUDIO (CMS)</span>
                                    </Link>
                                </DropdownMenuItem>

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
                                        <Settings size={16} /> <span className="font-bold">CONFIGURACIÓN</span>
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
                    <div className="flex items-stretch gap-2 flex-1">
                        <Link
                            href={(league.isEnterpriseActive || league.status === 'REJECTED') ? `/leagues/${league.id}` : '#'}
                            onClick={(e) => !(league.isEnterpriseActive || league.status === 'REJECTED') && e.preventDefault()}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-4 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                                (league.isEnterpriseActive || league.status === 'REJECTED')
                                ? "bg-[#00E676] text-[#0F172A] hover:bg-[#00E676]/90 shadow-[0_0_15px_rgba(0,230,118,0.2)]"
                                : "bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed grayscale opacity-50"
                            }`}
                        >
                            <LogIn size={15} /> Ingresar
                        </Link>

                        {/* WhatsApp Group Share for regular users too if active */}
                        {league.isEnterpriseActive && (league.accessCodePrefix || league.code) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const code = league.accessCodePrefix || league.code;
                                    const shareUrl = `${window.location.origin}/invite/${code}`;
                                    const msg = `Te invito a ${league.name.toUpperCase()}. Únete aquí: ${shareUrl}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
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
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Empty State                                                          */
/* ------------------------------------------------------------------ */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center mb-6">
                <Building2 size={36} className="text-slate-600" />
            </div>
            <h2 className="text-white font-russo text-xl uppercase tracking-tight mb-2">
                Sin Pollas Empresariales
            </h2>
            <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">
                Crea tu primer torneo corporativo y lleva el engagement de tu empresa al siguiente nivel.
            </p>
            <Link
                href="/empresa/crear"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00E676] text-[#0F172A] font-black uppercase tracking-widest text-sm hover:bg-[#00C853] hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,230,118,0.3)]"
            >
                <Plus size={16} /> Crear Primera Polla
            </Link>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                            */
/* ------------------------------------------------------------------ */
function MisEmpresasContent() {
    const { user, setSelectedLeague } = useAppStore();
    const { enterpriseLeagues, loading } = useLeagues();

    // Reset selected league when in the list view
    useEffect(() => {
        setSelectedLeague('global');
    }, [setSelectedLeague]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-[#00E676] animate-spin" />
                <p className="text-slate-500 font-russo uppercase tracking-widest text-xs animate-pulse">Cargando pollas empresariales...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] font-sans flex flex-col pb-20 relative overflow-x-hidden">
            
            <MainHeader />

            {/* Background glow */}
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#00E676] rounded-full blur-[160px] opacity-[0.04] pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[120px] opacity-[0.04] pointer-events-none" />

            {/* ── HEADER ── */}
            <header className="relative z-10 px-6 pt-8 pb-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <Link
                        href="/gateway"
                        className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-400" />
                    </Link>


                    {/* Botón Crear nueva */}
                    <Link
                        href="/empresa/crear"
                        className="p-2 rounded-full bg-[#00E676]/10 border border-[#00E676]/20 hover:bg-[#00E676] hover:text-[#0F172A] text-[#00E676] transition-all"
                        title="Crear nueva polla empresarial"
                    >
                        <Plus size={20} />
                    </Link>
                </div>

                {/* Hero text */}
                <div>
                    <h1 className="font-russo text-3xl text-white uppercase tracking-tight leading-none">
                        Pollas <span className="text-[#00E676]">Empresariales</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {enterpriseLeagues.length > 0
                            ? `${enterpriseLeagues.length} torneo${enterpriseLeagues.length !== 1 ? 's' : ''} corporativo${enterpriseLeagues.length !== 1 ? 's' : ''}`
                            : 'Crea tu primer torneo corporativo'}
                    </p>
                </div>
            </header>

            {/* ── CONTENT ── */}
            <main className="relative z-10 flex-1 px-6">
                {enterpriseLeagues.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {enterpriseLeagues.map((league) => (
                            <EnterpriseLeagueCard key={league.id} league={league} />
                        ))}
                    </div>
                )}
            </main>

            {/* ── FOOTER CTA (si hay ligas) ── */}
            {enterpriseLeagues.length > 0 && (
                <div className="relative z-10 px-6 pt-6">
                    <Link
                        href="/empresa/crear"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-dashed border-[#334155] text-slate-500 text-sm font-bold uppercase tracking-widest hover:border-[#00E676]/40 hover:text-[#00E676] transition-all"
                    >
                        <Plus size={16} /> Crear Nueva Polla Empresarial
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function EmpresaMisPollasPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#00E676] animate-spin" />
            </div>
        }>
            <MisEmpresasContent />
        </Suspense>
    );
}
