"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Trophy, Clock, Target, CreditCard, DollarSign,
  ChevronDown, ChevronUp, Search, MessageCircle, CheckCircle,
  AlertCircle, ExternalLink, Loader2, X, Download, Eye
} from 'lucide-react';
import api from '@/lib/api';
import { superAdminService } from '@/services/superAdminService';

// PDF generation
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// Extender jsPDF para TypeScript
interface jsPDFCustom extends jsPDF {
  autoTable: (options: any) => void;
  lastAutoTable: { finalY: number };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PlatformStats {
  users: { total: number; activeToday: number; newThisWeek: number };
  leagues: { total: number; active: number; pendingPayment: number; byTournament: { tournamentId: string; total: number; active: number }[] };
  predictions: { total: number; today: number };
  payments: { pendingCount: number; approvedThisMonth: number; revenueThisMonth: number };
}

type ActivePanel = 'users' | 'activeLeagues' | 'pendingLeagues' | 'predictions' | 'pendingPayments' | 'revenue' | null;
type SupportMode = 'BY_USER' | 'BY_LEAGUE';

// ─── Estilos ──────────────────────────────────────────────────────────────────

const S = {
  wrap: { backgroundColor: '#0F172A', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '11px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '12px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  card: { backgroundColor: '#1E293B', borderRadius: '14px', border: '1px solid #334155', padding: '14px', cursor: 'pointer', transition: 'all 0.2s' },
  cardActive: { backgroundColor: '#1E293B', borderRadius: '14px', border: '1px solid #00E676', padding: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 12px rgba(0,230,118,0.15)' },
  kpiIcon: { fontSize: '18px', marginBottom: '6px' },
  kpiValue: { fontFamily: "'Russo One', sans-serif", fontSize: '22px', color: 'white', lineHeight: '1' },
  kpiLabel: { fontSize: '10px', color: '#64748B', fontWeight: 'bold', marginTop: '4px', textTransform: 'uppercase' as const },
  kpiBadge: { fontSize: '9px', fontWeight: '900', padding: '2px 6px', borderRadius: '10px', marginTop: '4px', display: 'inline-block' },
  panel: { backgroundColor: '#152033', border: '1px solid #00E676', borderRadius: '14px', padding: '16px', marginTop: '12px', marginBottom: '8px' },
  panelTitle: { fontSize: '12px', fontWeight: '900', color: '#00E676', textTransform: 'uppercase' as const, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E293B' },
  rowLabel: { fontSize: '13px', color: 'white' },
  rowSub: { fontSize: '10px', color: '#64748B' },
  btn: { backgroundColor: '#00E676', border: 'none', borderRadius: '8px', color: '#0F172A', fontSize: '10px', fontWeight: '900', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' as const },
  btnGhost: { backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#94A3B8', fontSize: '10px', fontWeight: '900', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const },
  select: { width: '100%', padding: '10px 12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const },
  alertBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '900' },
  supportTable: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px' },
  th: { textAlign: 'left' as const, fontSize: '10px', color: '#64748B', fontWeight: '900', textTransform: 'uppercase' as const, padding: '8px 4px', borderBottom: '1px solid #334155' },
  td: { fontSize: '12px', color: 'white', padding: '10px 4px', borderBottom: '1px solid #1E293B' },
  dateInput: { backgroundColor: '#1E293B', border: '1px solid #334155', color: 'white', borderRadius: '6px', padding: '6px 10px', fontSize: '11px' },
  tabBtnRow: { display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #334155' },
  tabBtn: { padding: '8px 16px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', border: 'none', background: 'transparent' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$ ${n.toLocaleString('es-CO')}`;
const fmtCompact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PlatformDashboard({ tournamentId }: { tournamentId?: string }) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [allTxs, setAllTxs] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  // Filtros
  const [usersDateFilter, setUsersDateFilter] = useState<string>('');
  const [revenueDateFilter, setRevenueDateFilter] = useState<string>('');

  // Support Module State
  const [supportMode, setSupportMode] = useState<SupportMode>('BY_USER');
  // BY_USER mode states
  const [userSearchText, setUserSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userLeagueId, setUserLeagueId] = useState('');
  const [userSupportLeagues, setUserSupportLeagues] = useState<any[]>([]);
  // BY_LEAGUE mode states
  const [leagueSearchText, setLeagueSearchText] = useState('');
  const [selectedSupportLeague, setSelectedSupportLeague] = useState<any>(null);
  const [leagueParticipantId, setLeagueParticipantId] = useState('');
  const [leagueParticipants, setLeagueParticipants] = useState<any[]>([]);
  // Common support states
  const [supportDataLoading, setSupportDataLoading] = useState(false);
  const [supportPredictions, setSupportPredictions] = useState<any[]>([]);
  const [supportBonus, setSupportBonus] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, leaguesRaw, txsRaw, usersRaw] = await Promise.all([
        api.get('/admin/platform-stats'),
        superAdminService.getAllLeagues(tournamentId),
        superAdminService.getAllTransactions(tournamentId),
        superAdminService.getAllUsers(),
      ]);
      setStats(statsRes.data);
      setLeagues(Array.isArray(leaguesRaw) ? leaguesRaw : leaguesRaw?.data || []);
      const txArr = Array.isArray(txsRaw) ? txsRaw : txsRaw?.data || [];
      setAllTxs(txArr);
      setAllUsers(Array.isArray(usersRaw) ? usersRaw : usersRaw?.data || []);
    } catch (e) {
      console.error('PlatformDashboard load error', e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const togglePanel = (panel: ActivePanel) => setActivePanel(p => p === panel ? null : panel);

  // --- ACCIONES ---
  const handleVoucherDownload = (txId: string) => {
    try {
      superAdminService.downloadVoucher(txId);
    } catch (e) {
      alert("Error descargando el voucher");
    }
  };

  // --- FILTROS DE PANELES ---
  
  // Usuarios Filtrados
  const displayUsers = useMemo(() => {
    if (!usersDateFilter) {
      const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return allUsers.filter((u: any) => u.createdAt && new Date(u.createdAt) >= oneWeekAgo);
    }
    return allUsers.filter((u: any) => u.createdAt && u.createdAt.startsWith(usersDateFilter));
  }, [allUsers, usersDateFilter]);

  // Ligas Activas
  const activeLeagues = useMemo(() => leagues.filter(l => l.isPaid), [leagues]);

  // Pollas Sin Pago (Leagues with status 'PENDING_PAYMENT')
  const unpaidLeagues = useMemo(() => leagues.filter(l => l.status === 'PENDING_PAYMENT' && !l.isPaid), [leagues]);

  // Pagos Pendientes (Transactions status PENDING)
  const pendingTxs = useMemo(() => allTxs.filter(t => t.status === 'PENDING'), [allTxs]);

  // Filtros Revenue
  const displayRevenue = useMemo(() => {
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const valid = allTxs.filter((t: any) => t.status === 'APPROVED' || t.status === 'PAID');
    if (!revenueDateFilter) {
      return valid.filter(t => new Date(t.createdAt) >= startOfMonth);
    }
    return valid.filter(t => t.createdAt && t.createdAt.startsWith(revenueDateFilter));
  }, [allTxs, revenueDateFilter]);

  const totalRevenueDisp = displayRevenue.reduce((s, t) => s + Number(t.amount), 0);

  // --- MÓDULO DE SOPORTE ---

  // User search
  const filteredSupportUsers = userSearchText.length > 2
    ? allUsers.filter(u => `${u.fullName || ''} ${u.nickname || ''} ${u.email || ''}`.toLowerCase().includes(userSearchText.toLowerCase())).slice(0, 8)
    : [];

  const handleSelectUser = async (u: any) => {
    setSelectedUser(u);
    setUserSearchText(u.fullName || u.email);
    setUserLeagueId('');
    clearSupportData();
    try {
      const res = await api.get(`/users/${u.id}/details`);
      setUserSupportLeagues(res.data?.leagues || []);
    } catch {
      setUserSupportLeagues([]);
    }
  };

  // League search
  const filteredSupportLeagues = leagueSearchText.length > 2
    ? leagues.filter(l => l.name.toLowerCase().includes(leagueSearchText.toLowerCase())).slice(0, 8)
    : [];

  const handleSelectLeague = async (l: any) => {
    setSelectedSupportLeague(l);
    setLeagueSearchText(l.name);
    setLeagueParticipantId('');
    clearSupportData();
    // Fetch participants for this league
    try {
      const res = await api.get(`/leagues/${l.id}/participants?limit=500`);
      setLeagueParticipants(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { setLeagueParticipants([]); }
  };

  const clearSupportData = () => {
    setSupportPredictions([]);
    setSupportBonus([]);
  };

  // Cargar predicciones del usuario/participante
  const loadUserPredictions = async (uId: string, lId: string) => {
    if (!uId || !lId) return;
    setSupportDataLoading(true);
    clearSupportData();
    try {
      // 1. Get predictions (using new stats feature: we need all predictions of user for this league)
      const predsRes = await api.get(`/predictions/user/${uId}`, { params: { leagueId: lId } });
      const rawPreds = Array.isArray(predsRes.data) ? predsRes.data : [];
      
      // Need match data to show real scores. Load all matches for this tournament.
      const lg = leagues.find(l => l.id === lId);
      const matchesRes = await api.get(`/matches`, { params: { tournamentId: lg?.tournamentId } });
      const matches = Array.isArray(matchesRes.data) ? matchesRes.data : [];
      
      const enrichedPreds = rawPreds.map(p => {
        const match = matches.find((m: any) => m.id === p.matchId);
        return {
          ...p,
          matchStatus: match?.status,
          matchHomeTeam: match?.homeTeam,
          matchAwayTeam: match?.awayTeam,
          realHomeScore: match?.homeScore,
          realAwayScore: match?.awayScore,
        };
      }).sort((a, b) => new Date(a.match?.date || 0).getTime() - new Date(b.match?.date || 0).getTime() ? -1 : 1);
      
      setSupportPredictions(enrichedPreds);

      // 2. Get bonus predictions (simulated for now since no direct endpoint gives all bonus for a specific user easily without the whole ranking payload, but let's try ranking endpoint)
      const rankRes = await api.get(`/leagues/${lId}/ranking`);
      const rankData = Array.isArray(rankRes.data) ? rankRes.data : [];
      const userRank = rankData.find((r: any) => r.userId === uId);
      
      // We don't have detailed bonus answers per user in the ranking, just points.
      // But we can show their total bonus points easily.
      if (userRank) {
        setSupportBonus([{ id: '1', question: 'Total Puntos Extra (Bonus/Trivia)', points: userRank.triviaPoints || 0 }]);
      }

    } catch (e) { console.error('Error loading support data', e); }
    setSupportDataLoading(false);
  };

  // Triggers for loading
  useEffect(() => {
    if (supportMode === 'BY_USER' && selectedUser && userLeagueId) {
      loadUserPredictions(selectedUser.id, userLeagueId);
    }
  }, [supportMode, selectedUser, userLeagueId]);

  useEffect(() => {
    if (supportMode === 'BY_LEAGUE' && selectedSupportLeague && leagueParticipantId) {
      loadUserPredictions(leagueParticipantId, selectedSupportLeague.id);
    }
  }, [supportMode, selectedSupportLeague, leagueParticipantId]);


  // PDF Export
  const handleExportPDF = () => {
    let userName = '';
    let leagueName = '';
    
    if (supportMode === 'BY_USER' && selectedUser) {
      userName = selectedUser.fullName || selectedUser.email;
      const lg = leagues.find(l => l.id === userLeagueId);
      leagueName = lg ? lg.name : 'N/A';
    } else if (supportMode === 'BY_LEAGUE' && selectedSupportLeague) {
      leagueName = selectedSupportLeague.name;
      const pt = leagueParticipants.find(p => p.user?.id === leagueParticipantId);
      userName = pt ? (pt.user?.fullName || pt.user?.email) : 'N/A';
    }

    if (!userName || !supportPredictions.length) return;

    const doc = new jsPDF() as jsPDFCustom;
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(18);
    doc.text('Polla Mundialista - Detalle de Jugador', 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Jugador: ${userName}`, 14, 30);
    doc.text(`Polla: ${leagueName}`, 14, 36);
    doc.text(`Fecha: ${new Date().toLocaleString('es-CO')}`, 14, 42);

    // Predicciones
    doc.setFontSize(14);
    doc.text('Predicciones de Partidos', 14, 55);

    const matchRows = supportPredictions.map(p => [
      `${p.matchHomeTeam || 'Local'} vs ${p.matchAwayTeam || 'Visitante'}`,
      p.homeScore !== null && p.homeScore !== undefined ? `${p.homeScore} - ${p.awayScore}` : 'Sin Predicción',
      p.matchStatus === 'FINISHED' || p.matchStatus === 'COMPLETED' ? `${p.realHomeScore ?? '-'} - ${p.realAwayScore ?? '-'}` : 'Pendiente',
      p.points !== null && p.points !== undefined ? String(p.points) : '—',
      p.isJoker ? 'Sí' : 'No'
    ]);

    doc.autoTable({
      startY: 60,
      head: [['Partido', 'Predicción', 'Resultado Real', 'Puntos', 'Comodín']],
      body: matchRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 230, 118], textColor: [0,0,0], fontStyle: 'bold' }
    });

    const finalY = doc.lastAutoTable.finalY + 15;

    // Bonus
    doc.setFontSize(14);
    doc.text('Preguntas Bonus', 14, finalY);
    
    const bonusRows = supportBonus.map(b => [b.question, b.points]);
    doc.autoTable({
      startY: finalY + 5,
      head: [['Concepto', 'Puntos']],
      body: bonusRows,
      theme: 'grid'
    });

    // Summary
    const totalMatchPoints = supportPredictions.reduce((s, p) => s + (Number(p.points) || 0), 0);
    const totalBonus = supportBonus.reduce((s, b) => s + (Number(b.points) || 0), 0);
    const finalTotal = totalMatchPoints + totalBonus;
    
    const sumY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN FINAL', 14, sumY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Puntos por partidos: ${totalMatchPoints}`, 14, sumY + 8);
    doc.text(`Puntos extras/bonus: ${totalBonus}`, 14, sumY + 14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GENERAL: ${finalTotal}`, 14, sumY + 22);

    doc.save(`Reporte_${userName.replace(/\s+/g, '_')}_${leagueName.replace(/\s+/g, '_')}.pdf`);
  };


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Loader2 size={32} className="animate-spin" color="#00E676" />
      </div>
    );
  }

  const KPIs = [
    {
      id: 'users' as ActivePanel, icon: '👥', label: 'Usuarios',
      value: fmtCompact(stats?.users.total ?? 0), sub: `+${stats?.users.newThisWeek ?? 0} semana`,
      color: '#38BDF8', alert: null,
    },
    {
      id: 'activeLeagues' as ActivePanel, icon: '🏆', label: 'Pollas Activas',
      value: String(activeLeagues.length), sub: `pagadas y listas`,
      color: '#FACC15', alert: null,
    },
    {
      id: 'pendingLeagues' as ActivePanel, icon: '⏳', label: 'Sin Pago',
      value: String(unpaidLeagues.length), sub: 'pollas con deuda',
      color: '#FB923C', alert: unpaidLeagues.length > 0 ? 'warn' : null,
    },
    {
      id: 'predictions' as ActivePanel, icon: '🎯', label: 'Torneos',
      value: String(stats?.leagues.byTournament.filter(t => t.tournamentId === 'WC2026' || t.tournamentId === 'UCL2526').length), sub: 'oficiales',
      color: '#A78BFA', alert: null,
    },
    {
      id: 'pendingPayments' as ActivePanel, icon: '💳', label: 'Pagos Pendientes',
      value: String(stats?.payments.pendingCount ?? 0), sub: 'por aprobar',
      color: '#F87171', alert: (stats?.payments.pendingCount ?? 0) > 0 ? 'error' : null,
    },
    {
      id: 'revenue' as ActivePanel, icon: '💰', label: 'Ingresos Aprobados',
      value: fmtCompact(stats?.payments.revenueThisMonth ?? 0), sub: 'global',
      color: '#00E676', alert: null,
    },
  ];

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* ── ALERTAS ────────────────────────────────────────────── */}
      {((stats?.payments.pendingCount ?? 0) > 0 || unpaidLeagues.length > 0) && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {(stats?.payments.pendingCount ?? 0) > 0 && (
            <div style={{ ...S.alertBadge, backgroundColor: 'rgba(248,113,113,0.12)', border: '1px solid #F87171', color: '#F87171' }}>
              <AlertCircle size={13} /> {stats!.payments.pendingCount} comprobante{stats!.payments.pendingCount > 1 ? 's' : ''} por aprobar
            </div>
          )}
          {unpaidLeagues.length > 0 && (
            <div style={{ ...S.alertBadge, backgroundColor: 'rgba(251,146,60,0.12)', border: '1px solid #FB923C', color: '#FB923C' }}>
              <Clock size={13} /> {unpaidLeagues.length} pollas en estado PENDING_PAYMENT
            </div>
          )}
        </div>
      )}

      {/* ── SECCIÓN 1: KPIs ────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Métricas Generales</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {KPIs.map(kpi => {
            const isOpen = activePanel === kpi.id;
            return (
              <div
                key={kpi.id}
                style={isOpen ? S.cardActive : S.card}
                onClick={() => togglePanel(kpi.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={S.kpiIcon}>{kpi.icon}</div>
                    <div style={{ ...S.kpiValue, color: isOpen ? kpi.color : 'white' }}>{kpi.value}</div>
                    <div style={S.kpiLabel}>{kpi.label}</div>
                    <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>{kpi.sub}</div>
                  </div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>
                    {isOpen ? <ChevronUp size={14} color={kpi.color} /> : <ChevronDown size={14} />}
                  </div>
                </div>
                {kpi.alert && (
                  <div style={{ ...S.kpiBadge, backgroundColor: kpi.alert === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(251,146,60,0.15)', color: kpi.alert === 'error' ? '#F87171' : '#FB923C' }}>
                    {kpi.alert === 'error' ? '● Requiere acción' : '! Atención'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Paneles de detalle */}
        {activePanel === 'users' && (
          <div style={S.panel}>
            <div style={{ ...S.panelTitle, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Registro de Usuarios ({displayUsers.length})</div>
              <input type="date" style={S.dateInput} value={usersDateFilter} onChange={e => setUsersDateFilter(e.target.value)} />
            </div>
            {displayUsers.length === 0 ? <p style={{ color: '#64748B', fontSize: '12px' }}>No hay registros en esta fecha.</p> :
              displayUsers.slice(0, 50).map((u: any) => (
                <div key={u.id} style={S.row}>
                  <div>
                    <div style={S.rowLabel}>{u.fullName || u.nickname}</div>
                    <div style={S.rowSub}>{u.email}</div>
                  </div>
                  <a href={`/super-admin?tab=users&userId=${u.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                     <button style={S.btnGhost}><Search size={10} /> Ver info</button>
                  </a>
                </div>
              ))
            }
          </div>
        )}

        {activePanel === 'activeLeagues' && (
          <div style={S.panel}>
            <div style={S.panelTitle}><Trophy size={14} /> Pollas activas ({activeLeagues.length})</div>
            {activeLeagues.slice(0, 30).map((l: any) => (
              <div key={l.id} style={S.row}>
                <div>
                  <div style={S.rowLabel}>{l.name} <span style={{fontSize: '10px', color: '#94A3B8'}}>- {l.tournamentId}</span></div>
                  <div style={{...S.rowSub, display: 'flex', gap: '8px', marginTop: '4px'}}>
                     <span style={{ backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px' }}>👥 {l.participants?.length ?? 0} parts.</span>
                     <span style={{ backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px' }}>👑 {l.adminName || 'Admin'}</span>
                  </div>
                </div>
                <a href={`/leagues/${l.id}?actAsSuperAdmin=true`} target="_blank" rel="noreferrer">
                  <button style={S.btnGhost}><Eye size={10} /> Ver Liga</button>
                </a>
              </div>
            ))}
          </div>
        )}

        {activePanel === 'pendingLeagues' && (
          <div style={S.panel}>
            <div style={S.panelTitle}><Clock size={14} /> Pollas sin pago (PENDING_PAYMENT) ({unpaidLeagues.length})</div>
            {unpaidLeagues.length === 0 ? <p style={{ color: '#64748B', fontSize: '12px' }}>Todas las pollas de pago han finalizado su registro.</p> :
              unpaidLeagues.map((l: any) => {
                const phone = l.adminPhone || l.creator?.phoneNumber;
                const wpMsg = encodeURIComponent(`Hola ${l.adminName || l.creator?.fullName || ''}, te escribimos de Polla Mundialista. Tu polla "${l.name}" está pendiente de pago. ¿Necesitas ayuda para completar el proceso?`);
                return (
                  <div key={l.id} style={S.row}>
                    <div>
                      <div style={{...S.rowLabel, color: '#FB923C'}}>{l.name}</div>
                      <div style={S.rowSub}>
                         Admin: {l.adminName || l.creator?.fullName || l.creator?.email} • Creada: {new Date(l.createdAt || Date.now()).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                    {phone && (
                      <a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${wpMsg}`} target="_blank" rel="noreferrer">
                        <button style={S.btn}><MessageCircle size={10} /> WhatsApp</button>
                      </a>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {activePanel === 'predictions' && (
          <div style={S.panel}>
            <div style={S.panelTitle}><Target size={14} /> Torneos soportados actualmente</div>
            {(stats?.leagues.byTournament || []).filter(t => t.tournamentId === 'WC2026' || t.tournamentId === 'UCL2526').map((t: any) => (
              <div key={t.tournamentId} style={S.row}>
                <div style={S.rowLabel}>{t.tournamentId}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Russo One', sans-serif", color: '#A78BFA' }}>{t.total} pollas</div>
                  <div style={S.rowSub}>{t.active} activas</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activePanel === 'pendingPayments' && (
          <div style={S.panel}>
            <div style={S.panelTitle}><CreditCard size={14} /> Pagos pendientes de validar ({pendingTxs.length})</div>
            {pendingTxs.length === 0 ? <p style={{ color: '#64748B', fontSize: '12px' }}>No hay comprobantes por aprobar. ✅</p> :
              pendingTxs.slice(0, 20).map((t: any) => (
                <div key={t.id} style={S.row}>
                  <div>
                    <div style={S.rowLabel}>{t.user?.nickname || t.user?.fullName || '—'}</div>
                    <div style={S.rowSub}>{t.league?.name || 'Voucher manual'} · {fmt(Number(t.amount))}</div>
                  </div>
                  {/* Para aprobar lo ideal es derivar al tab de transacciones nativo donde ven la foto */}
                  <a href={`/super-admin?tab=transactions`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                     <button style={S.btnGhost}>Gestionar pagos</button>
                  </a>
                </div>
              ))}
          </div>
        )}

        {activePanel === 'revenue' && (
          <div style={S.panel}>
            <div style={{ ...S.panelTitle, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} /> Ingresos confirmados ({displayRevenue.length})</div>
              <input type="date" style={S.dateInput} value={revenueDateFilter} onChange={e => setRevenueDateFilter(e.target.value)} />
            </div>
            <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px solid #1E293B', marginBottom: '8px' }}>
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: '32px', color: '#00E676' }}>{fmt(totalRevenueDisp)}</div>
              <div style={{ color: '#64748B', fontSize: '11px', marginTop: '4px' }}>COP recaudados en fechas seleccionadas</div>
            </div>
            {displayRevenue.slice(0, 50).map((t: any) => (
                <div key={t.id} style={S.row}>
                  <div>
                    <div style={S.rowLabel}>{t.user?.fullName || t.user?.email || '—'}</div>
                    <div style={S.rowSub}>{t.league?.name || 'Planes Plataforma'} · {new Date(t.createdAt).toLocaleDateString('es-CO')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontFamily: "'Russo One', sans-serif", color: '#00E676', fontSize: '14px' }}>{fmt(Number(t.amount))}</div>
                    <button style={S.btnGhost} onClick={() => handleVoucherDownload(t.id)} title="Descargar Voucher">
                      <Download size={10} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── SECCIÓN 2: Por Torneo ──────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Actividad por Torneo</div>
        <div style={S.grid2}>
          {(stats?.leagues.byTournament || []).filter(t => t.tournamentId === 'WC2026' || t.tournamentId === 'UCL2526').map((t: any) => {
            const tLeagues = leagues.filter((l: any) => l.tournamentId === t.tournamentId && l.isPaid);
            return (
              <div key={t.tournamentId} style={{ ...S.card, cursor: 'default' }}>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#00E676', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  {t.tournamentId} - Oficiales
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: '20px' }}>{t.active}</div>
                    <div style={S.rowSub}>Pollas activas</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: '20px' }}>{t.total}</div>
                    <div style={S.rowSub}>Total pollas</div>
                  </div>
                </div>
                <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                  {tLeagues.slice(0, 8).map((l: any) => (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
                      <div style={{ fontSize: '11px', color: '#CBD5E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{l.name}</div>
                      <a href={`/leagues/${l.id}?actAsSuperAdmin=true`} target="_blank" rel="noreferrer">
                        <button style={{ ...S.btnGhost, padding: '4px 8px' }}><Eye size={9} /> Entrar</button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECCIÓN 3: Soporte Predicciones ───────────────────── */}
      <div style={S.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={S.sectionTitle}>Módulo Soporte — Predicciones & Bonus</div>
           {(supportPredictions.length > 0) && (
             <button style={{ ...S.btn, marginBottom: '12px' }} onClick={handleExportPDF}>
               <Download size={12} /> Exportar Reporte PDF
             </button>
           )}
        </div>
        
        <div style={S.card}>
          {/* Selector de modo */}
          <div style={S.tabBtnRow}>
             <button 
               style={{ ...S.tabBtn, borderBottom: supportMode === 'BY_USER' ? '2px solid #00E676' : '2px solid transparent', color: supportMode === 'BY_USER' ? '#00E676' : '#94A3B8' }}
               onClick={() => { setSupportMode('BY_USER'); clearSupportData(); }}
             >
               Buscar por Usuario
             </button>
             <button 
               style={{ ...S.tabBtn, borderBottom: supportMode === 'BY_LEAGUE' ? '2px solid #00E676' : '2px solid transparent', color: supportMode === 'BY_LEAGUE' ? '#00E676' : '#94A3B8' }}
               onClick={() => { setSupportMode('BY_LEAGUE'); clearSupportData(); }}
             >
               Buscar por Polla
             </button>
          </div>

          {/* MODO 1: BY_USER */}
          {supportMode === 'BY_USER' && (
            <>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px' }}>
                  <Search size={14} color="#64748B" />
                  <input
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none' }}
                    placeholder="Buscar participante (nombre o correo)..."
                    value={userSearchText}
                    onChange={e => { setUserSearchText(e.target.value); setSelectedUser(null); }}
                  />
                  {userSearchText && <button onClick={() => { setUserSearchText(''); setSelectedUser(null); setUserLeagueId(''); clearSupportData(); }} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={14} /></button>}
                </div>
                {filteredSupportUsers.length > 0 && !selectedUser && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', marginTop: '4px', overflow: 'hidden' }}>
                    {filteredSupportUsers.map((u: any) => (
                      <div key={u.id} onClick={() => handleSelectUser(u)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #334155', fontSize: '13px' }}>
                        <span style={{ color: 'white' }}>{u.fullName || u.nickname}</span>
                        <span style={{ color: '#64748B', marginLeft: '8px', fontSize: '11px' }}>{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedUser && (
                <div style={{ marginBottom: '12px' }}>
                  <select style={S.select} value={userLeagueId} onChange={e => setUserLeagueId(e.target.value)}>
                    <option value="">— Seleccionar la polla del participante —</option>
                    {userSupportLeagues.map((l: any) => (
                      <option key={l.leagueId} value={l.leagueId}>{l.leagueName} {l.leagueCode ? `(${l.leagueCode})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* MODO 2: BY_LEAGUE */}
          {supportMode === 'BY_LEAGUE' && (
            <>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px' }}>
                  <Search size={14} color="#64748B" />
                  <input
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none' }}
                    placeholder="Buscar polla por nombre..."
                    value={leagueSearchText}
                    onChange={e => { setLeagueSearchText(e.target.value); setSelectedSupportLeague(null); }}
                  />
                  {leagueSearchText && <button onClick={() => { setLeagueSearchText(''); setSelectedSupportLeague(null); setLeagueParticipantId(''); clearSupportData(); }} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={14} /></button>}
                </div>
                {filteredSupportLeagues.length > 0 && !selectedSupportLeague && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', marginTop: '4px', overflow: 'hidden' }}>
                    {filteredSupportLeagues.map((l: any) => (
                      <div key={l.id} onClick={() => handleSelectLeague(l)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #334155', fontSize: '13px' }}>
                        <span style={{ color: 'white' }}>{l.name}</span>
                        <span style={{ color: '#64748B', marginLeft: '8px', fontSize: '11px' }}>{l.tournamentId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedSupportLeague && (
                <div style={{ marginBottom: '12px' }}>
                  <select style={S.select} value={leagueParticipantId} onChange={e => setLeagueParticipantId(e.target.value)}>
                    <option value="">— Seleccionar participante —</option>
                    {leagueParticipants.map((p: any) => (
                      <option key={p.user?.id} value={p.user?.id}>{p.user?.fullName || p.user?.email}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}


          {/* Tabla de Resultados (compartida por ambos modos) */}
          {supportDataLoading && <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 size={20} className="animate-spin" color="#00E676" /></div>}
          
          {!supportDataLoading && supportPredictions.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={S.sectionTitle}>1. Predicciones de partidos</div>
              <div style={{ overflowX: 'auto', backgroundColor: '#0F172A', borderRadius: '10px', border: '1px solid #334155' }}>
                <table style={S.supportTable}>
                  <thead>
                    <tr>
                      <th style={S.th}>Partido</th>
                      <th style={S.th}>Su Predicción</th>
                      <th style={S.th}>Resultado Real</th>
                      <th style={S.th}>Puntos</th>
                      <th style={S.th}>Comodín</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportPredictions.map((p: any) => (
                      <tr key={p.id || p.matchId}>
                        <td style={S.td}>{p.matchHomeTeam || 'Local'} vs {p.matchAwayTeam || 'Visita'}</td>
                        <td style={{ ...S.td, fontFamily: "'Russo One', sans-serif" }}>
                          {p.homeScore} - {p.awayScore}
                        </td>
                        <td style={{ ...S.td, color: '#94A3B8' }}>
                          {['FINISHED', 'COMPLETED'].includes(p.matchStatus) ? `${p.realHomeScore} - ${p.realAwayScore}` : p.matchStatus}
                        </td>
                        <td style={{ ...S.td, color: (p.points > 0) ? '#00E676' : '#64748B', fontWeight: 'bold' }}>
                          {p.points !== null ? p.points : '—'}
                        </td>
                        <td style={S.td}>
                          {p.isJoker ? <span style={{ color: '#FACC15', fontSize: '11px', fontWeight: '900' }}>⭐ SÍ</span> : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bonus / Trivia */}
              <div style={{ marginTop: '20px' }}>
                <div style={S.sectionTitle}>2. Puntos extra y Bonus</div>
                <div style={{ overflowX: 'auto', backgroundColor: '#0F172A', borderRadius: '10px', border: '1px solid #334155' }}>
                  <table style={S.supportTable}>
                    <thead>
                      <tr>
                        <th style={S.th}>Pregunta / Concepto</th>
                        <th style={S.th}>Respuesta</th>
                        <th style={S.th}>Puntos Obtenidos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supportBonus.length === 0 ? (
                        <tr><td colSpan={3} style={{ ...S.td, textAlign: 'center', color: '#64748B' }}>No hay puntos bonus disponibles</td></tr>
                      ) : (
                        supportBonus.map((b: any) => (
                          <tr key={b.id}>
                            <td style={S.td}>{b.question}</td>
                            <td style={S.td}>{b.answer || '—'}</td>
                            <td style={{ ...S.td, color: '#00E676', fontWeight: 'bold' }}>{b.points}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
