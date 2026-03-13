"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Trophy, Clock, Target, CreditCard, DollarSign,
  ChevronDown, ChevronUp, Search, MessageCircle, CheckCircle,
  AlertCircle, ExternalLink, Loader2, X
} from 'lucide-react';
import api from '@/lib/api';
import { superAdminService } from '@/services/superAdminService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PlatformStats {
  users: { total: number; activeToday: number; newThisWeek: number };
  leagues: { total: number; active: number; pendingPayment: number; byTournament: { tournamentId: string; total: number; active: number }[] };
  predictions: { total: number; today: number };
  payments: { pendingCount: number; approvedThisMonth: number; revenueThisMonth: number };
}

type ActivePanel = 'users' | 'activeLeagues' | 'pendingLeagues' | 'predictions' | 'pendingPayments' | 'revenue' | null;

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
  supportTable: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, fontSize: '10px', color: '#64748B', fontWeight: '900', textTransform: 'uppercase' as const, padding: '8px 4px', borderBottom: '1px solid #334155' },
  td: { fontSize: '12px', color: 'white', padding: '10px 4px', borderBottom: '1px solid #1E293B' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$ ${n.toLocaleString('es-CO')}`;
const fmtCompact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PlatformDashboard({ tournamentId }: { tournamentId?: string }) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);
  const [allTxs, setAllTxs] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  // Módulo soporte
  const [supportSearch, setSupportSearch] = useState('');
  const [supportUser, setSupportUser] = useState<any>(null);
  const [supportLeagueId, setSupportLeagueId] = useState('');
  const [supportMatches, setSupportMatches] = useState<any[]>([]);
  const [supportMatchId, setSupportMatchId] = useState('');
  const [supportPreds, setSupportPreds] = useState<any[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, leaguesRaw, txsRaw, usersRaw, pendingRes] = await Promise.all([
        api.get('/admin/platform-stats'),
        superAdminService.getAllLeagues(tournamentId),
        superAdminService.getAllTransactions(tournamentId),
        superAdminService.getAllUsers(),
        api.get('/transactions/pending'),
      ]);
      setStats(statsRes.data);
      setLeagues(Array.isArray(leaguesRaw) ? leaguesRaw : leaguesRaw?.data || []);
      const txArr = Array.isArray(txsRaw) ? txsRaw : txsRaw?.data || [];
      setAllTxs(txArr);
      setPendingTxs(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setAllUsers(Array.isArray(usersRaw) ? usersRaw : usersRaw?.data || []);
    } catch (e) {
      console.error('PlatformDashboard load error', e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const togglePanel = (panel: ActivePanel) => setActivePanel(p => p === panel ? null : panel);

  // Soporte: buscar usuario
  const filteredUsers = supportSearch.length > 1
    ? allUsers.filter((u: any) => (u.fullName || u.nickname || '').toLowerCase().includes(supportSearch.toLowerCase())).slice(0, 8)
    : [];

  const selectSupportUser = async (user: any) => {
    setSupportUser(user);
    setSupportSearch(user.fullName || user.nickname || user.email);
    setSupportLeagueId('');
    setSupportMatchId('');
    setSupportPreds([]);
    setSupportMatches([]);
  };

  const onSupportLeagueChange = async (lid: string) => {
    setSupportLeagueId(lid);
    setSupportMatchId('');
    setSupportPreds([]);
    if (!lid) return;
    try {
      const res = await api.get(`/leagues/${lid}/matches`);
      const ms = Array.isArray(res.data) ? res.data : [];
      setSupportMatches(ms.filter((m: any) => ['FINISHED', 'COMPLETED', 'LIVE'].includes(m.status)));
    } catch { setSupportMatches([]); }
  };

  const onSupportMatchChange = async (mid: string) => {
    setSupportMatchId(mid);
    setSupportPreds([]);
    if (!mid || !supportLeagueId) return;
    setSupportLoading(true);
    try {
      const res = await api.get(`/predictions/league/${supportLeagueId}/match/${mid}`);
      setSupportPreds(Array.isArray(res.data) ? res.data : []);
    } catch { setSupportPreds([]); }
    setSupportLoading(false);
  };

  const approveTx = async (id: string) => {
    if (!confirm('¿Confirmar aprobación de pago?')) return;
    await superAdminService.approveTransaction(id);
    load();
  };

  // Ligas del usuario soporte seleccionado
  const userLeagues = supportUser
    ? leagues.filter((l: any) => l.creator?.id === supportUser.id || l.participants?.some((p: any) => p.userId === supportUser.id))
    : [];

  // Usuarios nuevos esta semana
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newUsers = allUsers.filter((u: any) => u.createdAt && new Date(u.createdAt) >= oneWeekAgo);

  // Ligas activas (isPaid)
  const activeLeagues = leagues.filter((l: any) => l.isPaid);

  // Ligas pendientes de pago
  const pendingLeagues = leagues.filter((l: any) => !l.isPaid && l.status !== 'ACTIVE');

  // Ingresos del mes (frontend calc)
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const monthRevenue = allTxs
    .filter((t: any) => (t.status === 'APPROVED' || t.status === 'PAID') && new Date(t.createdAt) >= startOfMonth)
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
  const monthCount = allTxs.filter((t: any) => (t.status === 'APPROVED' || t.status === 'PAID') && new Date(t.createdAt) >= startOfMonth).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Loader2 size={32} className="animate-spin" color="#00E676" />
      </div>
    );
  }

  const KPIs = [
    {
      id: 'users' as ActivePanel, icon: '👥', label: 'Usuarios Totales',
      value: fmtCompact(stats?.users.total ?? 0), sub: `+${stats?.users.newThisWeek ?? 0} esta semana`,
      color: '#38BDF8', alert: null,
    },
    {
      id: 'activeLeagues' as ActivePanel, icon: '🏆', label: 'Pollas Activas',
      value: String(activeLeagues.length), sub: `de ${stats?.leagues.total ?? 0} totales`,
      color: '#FACC15', alert: null,
    },
    {
      id: 'pendingLeagues' as ActivePanel, icon: '⏳', label: 'Pendientes Pago',
      value: String(stats?.leagues.pendingPayment ?? 0), sub: 'participantes bloqueados',
      color: '#FB923C', alert: (stats?.leagues.pendingPayment ?? 0) > 0 ? 'warn' : null,
    },
    {
      id: 'predictions' as ActivePanel, icon: '🎯', label: 'Predicciones',
      value: fmtCompact(stats?.predictions.total ?? 0), sub: 'total registradas',
      color: '#A78BFA', alert: null,
    },
    {
      id: 'pendingPayments' as ActivePanel, icon: '💳', label: 'Pagos Pendientes',
      value: String(stats?.payments.pendingCount ?? 0), sub: 'por aprobar',
      color: '#F87171', alert: (stats?.payments.pendingCount ?? 0) > 0 ? 'error' : null,
    },
    {
      id: 'revenue' as ActivePanel, icon: '💰', label: 'Ingresos del Mes',
      value: fmtCompact(stats?.payments.revenueThisMonth ?? 0), sub: `${stats?.payments.approvedThisMonth ?? 0} transacciones`,
      color: '#00E676', alert: null,
    },
  ];

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* ── ALERTAS ────────────────────────────────────────────── */}
      {((stats?.payments.pendingCount ?? 0) > 0 || (stats?.leagues.pendingPayment ?? 0) > 0) && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {(stats?.payments.pendingCount ?? 0) > 0 && (
            <div style={{ ...S.alertBadge, backgroundColor: 'rgba(248,113,113,0.12)', border: '1px solid #F87171', color: '#F87171' }}>
              <AlertCircle size={13} /> {stats!.payments.pendingCount} pago{stats!.payments.pendingCount > 1 ? 's' : ''} pendiente{stats!.payments.pendingCount > 1 ? 's' : ''} de aprobar
            </div>
          )}
          {(stats?.leagues.pendingPayment ?? 0) > 0 && (
            <div style={{ ...S.alertBadge, backgroundColor: 'rgba(251,146,60,0.12)', border: '1px solid #FB923C', color: '#FB923C' }}>
              <Clock size={13} /> {stats!.leagues.pendingPayment} participante{stats!.leagues.pendingPayment > 1 ? 's' : ''} con pago pendiente
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
            <div style={S.panelTitle}><Users size={14} /> Usuarios nuevos esta semana ({newUsers.length})</div>
            {newUsers.length === 0 ? <p style={{ color: '#64748B', fontSize: '12px' }}>Sin registros nuevos esta semana.</p> :
              newUsers.slice(0, 20).map((u: any) => (
                <div key={u.id} style={S.row}>
                  <div>
                    <div style={S.rowLabel}>{u.fullName || u.nickname}</div>
                    <div style={S.rowSub}>{u.email}</div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '—'}
                  </div>
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
                  <div style={S.rowLabel}>{l.name}</div>
                  <div style={S.rowSub}>{l.tournamentId} · {l.participants?.length ?? '—'} jugadores</div>
                </div>
                <a href={`/leagues/${l.id}/ranking`} target="_blank" rel="noreferrer">
                  <button style={S.btnGhost}><ExternalLink size={10} /> Ranking</button>
                </a>
              </div>
            ))}
          </div>
        )}

        {activePanel === 'pendingLeagues' && (
          <div style={S.panel}>
            <div style={S.panelTitle}><Clock size={14} /> Pollas pendientes de pago ({pendingLeagues.length})</div>
            {pendingLeagues.length === 0 ? <p style={{ color: '#64748B', fontSize: '12px' }}>No hay pollas pendientes.</p> :
              pendingLeagues.slice(0, 20).map((l: any) => {
                const phone = l.adminPhone || l.creator?.phoneNumber;
                const wpMsg = encodeURIComponent(`Hola, te escribimos de Polla Mundialista. Tu polla "${l.name}" está pendiente de pago. ¿Necesitas ayuda para completar el proceso?`);
                return (
                  <div key={l.id} style={S.row}>
                    <div>
                      <div style={S.rowLabel}>{l.name}</div>
                      <div style={S.rowSub}>{l.creator?.fullName || l.creator?.email} · {l.tournamentId}</div>
                    </div>
                    {phone && (
                      <a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${wpMsg}`} target="_blank" rel="noreferrer">
                        <button style={S.btn}><MessageCircle size={10} /> Contactar</button>
                      </a>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {activePanel === 'predictions' && (
          <div style={S.panel}>
            <div style={S.panelTitle}><Target size={14} /> Predicciones por torneo</div>
            {(stats?.leagues.byTournament || []).map((t: any) => (
              <div key={t.tournamentId} style={S.row}>
                <div style={S.rowLabel}>{t.tournamentId}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Russo One', sans-serif", color: '#A78BFA' }}>{t.total} pollas</div>
                  <div style={S.rowSub}>{t.active} activas</div>
                </div>
              </div>
            ))}
            <div style={{ ...S.row, borderBottom: 'none', marginTop: '4px' }}>
              <div style={{ color: '#64748B', fontSize: '11px' }}>Total predicciones registradas</div>
              <div style={{ fontFamily: "'Russo One', sans-serif", color: '#A78BFA', fontSize: '20px' }}>
                {fmtCompact(stats?.predictions.total ?? 0)}
              </div>
            </div>
          </div>
        )}

        {activePanel === 'pendingPayments' && (
          <div style={S.panel}>
            <div style={S.panelTitle}><CreditCard size={14} /> Pagos pendientes ({pendingTxs.length})</div>
            {pendingTxs.length === 0 ? <p style={{ color: '#64748B', fontSize: '12px' }}>No hay pagos pendientes. ✅</p> :
              pendingTxs.slice(0, 20).map((t: any) => (
                <div key={t.id} style={S.row}>
                  <div>
                    <div style={S.rowLabel}>{t.user?.nickname || t.user?.fullName || '—'}</div>
                    <div style={S.rowSub}>{t.league?.name || 'Sin liga'} · {fmt(Number(t.amount))}</div>
                  </div>
                  <button style={S.btn} onClick={() => approveTx(t.id)}><CheckCircle size={10} /> Aprobar</button>
                </div>
              ))}
          </div>
        )}

        {activePanel === 'revenue' && (
          <div style={S.panel}>
            <div style={S.panelTitle}><DollarSign size={14} /> Ingresos del mes ({monthCount} pagos)</div>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: '32px', color: '#00E676' }}>{fmt(monthRevenue)}</div>
              <div style={{ color: '#64748B', fontSize: '11px', marginTop: '4px' }}>COP · {new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' })}</div>
            </div>
            {allTxs
              .filter((t: any) => (t.status === 'APPROVED' || t.status === 'PAID') && new Date(t.createdAt) >= startOfMonth)
              .slice(0, 15)
              .map((t: any) => (
                <div key={t.id} style={S.row}>
                  <div>
                    <div style={S.rowLabel}>{t.user?.nickname || t.user?.fullName || '—'}</div>
                    <div style={S.rowSub}>{t.league?.name || '—'} · {new Date(t.createdAt).toLocaleDateString('es-CO')}</div>
                  </div>
                  <div style={{ fontFamily: "'Russo One', sans-serif", color: '#00E676', fontSize: '14px' }}>{fmt(Number(t.amount))}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── SECCIÓN 2: Por Torneo ──────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Actividad por Torneo</div>
        <div style={S.grid2}>
          {(stats?.leagues.byTournament || []).map((t: any) => {
            const tLeagues = leagues.filter((l: any) => l.tournamentId === t.tournamentId && l.isPaid);
            return (
              <div key={t.tournamentId} style={{ ...S.card, cursor: 'default' }}>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#00E676', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  {t.tournamentId}
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
                      <a href={`/leagues/${l.id}/ranking`} target="_blank" rel="noreferrer">
                        <button style={{ ...S.btnGhost, padding: '4px 8px' }}><ExternalLink size={9} /></button>
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
        <div style={S.sectionTitle}>Módulo Soporte — Ver predicciones por partido</div>
        <div style={S.card}>
          {/* Buscador usuario */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px' }}>
              <Search size={14} color="#64748B" />
              <input
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none' }}
                placeholder="Buscar usuario por nombre..."
                value={supportSearch}
                onChange={e => { setSupportSearch(e.target.value); setSupportUser(null); }}
              />
              {supportSearch && <button onClick={() => { setSupportSearch(''); setSupportUser(null); setSupportLeagueId(''); setSupportMatches([]); setSupportMatchId(''); setSupportPreds([]); }} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={14} /></button>}
            </div>
            {filteredUsers.length > 0 && !supportUser && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', marginTop: '4px', overflow: 'hidden' }}>
                {filteredUsers.map((u: any) => (
                  <div key={u.id} onClick={() => selectSupportUser(u)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #334155', fontSize: '13px' }}>
                    <span style={{ color: 'white' }}>{u.fullName || u.nickname}</span>
                    <span style={{ color: '#64748B', marginLeft: '8px', fontSize: '11px' }}>{u.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Select de liga */}
          {supportUser && (
            <div style={{ marginBottom: '12px' }}>
              <select style={S.select} value={supportLeagueId} onChange={e => onSupportLeagueChange(e.target.value)}>
                <option value="">— Seleccionar polla —</option>
                {leagues.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.tournamentId})</option>
                ))}
              </select>
            </div>
          )}

          {/* Select de partido */}
          {supportLeagueId && (
            <div style={{ marginBottom: '12px' }}>
              <select style={S.select} value={supportMatchId} onChange={e => onSupportMatchChange(e.target.value)}>
                <option value="">— Seleccionar partido —</option>
                {supportMatches.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.homeTeam} vs {m.awayTeam} ({m.status})</option>
                ))}
              </select>
              {supportMatches.length === 0 && <div style={{ color: '#64748B', fontSize: '11px', marginTop: '6px' }}>Solo se muestran partidos terminados o en vivo.</div>}
            </div>
          )}

          {/* Tabla de predicciones */}
          {supportLoading && <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 size={20} className="animate-spin" color="#00E676" /></div>}
          {!supportLoading && supportPreds.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={S.supportTable}>
                <thead>
                  <tr>
                    <th style={S.th}>Jugador</th>
                    <th style={S.th}>Predicción</th>
                    <th style={S.th}>Puntos</th>
                    <th style={S.th}>Joker</th>
                  </tr>
                </thead>
                <tbody>
                  {supportPreds.map((p: any) => (
                    <tr key={p.userId}>
                      <td style={S.td}>{p.fullName}</td>
                      <td style={{ ...S.td, fontFamily: "'Russo One', sans-serif" }}>
                        {p.hasPrediction ? `${p.homeScore} - ${p.awayScore}` : <span style={{ color: '#475569' }}>Sin predicción</span>}
                      </td>
                      <td style={{ ...S.td, color: p.points > 0 ? '#00E676' : '#64748B', fontWeight: 'bold' }}>
                        {p.points !== null ? p.points : '—'}
                      </td>
                      <td style={S.td}>
                        {p.isJoker ? <span style={{ color: '#FACC15', fontSize: '11px', fontWeight: '900' }}>⭐ JOKER</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!supportLoading && supportMatchId && supportPreds.length === 0 && (
            <div style={{ color: '#64748B', fontSize: '12px', textAlign: 'center', padding: '20px' }}>No hay predicciones para este partido en esta polla.</div>
          )}
        </div>
      </div>
    </div>
  );
}
