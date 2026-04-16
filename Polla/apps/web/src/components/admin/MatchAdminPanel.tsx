import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Tv, RefreshCcw, Download, Copy, BarChart3, Users, Star, PieChart, ShoppingCart, Package, Gamepad2, Lock, Clock, CheckCircle, Zap, Upload, X, ChevronDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTournament } from '@/hooks/useTournament';

interface MatchAdminPanelProps {
  league: any;
  onUpdate: () => void;
}

/* =============================================================================
   PRECIOS Y PAQUETES (Constantes Frontend)
   ============================================================================= */
const MATCH_PRICES: Record<string, number> = {
  regular: 15000,
  colombia: 25000,
  knockout: 35000,
};

const MATCH_PACKAGES = [
  {
    id: 'pack_colombia_grupos',
    label: 'Pack Colombia Grupos',
    price: 60000,
    description: 'Todos los partidos de Colombia en fase de grupos',
    emoji: '🇨🇴',
    color: '#FACC15',
  },
  {
    id: 'pack_knockouts',
    label: 'Pack Eliminatorias',
    price: 90000,
    description: 'Cuartos de final + Semis + Final',
    emoji: '🏆',
    color: '#00E676',
  },
  {
    id: 'pack_mundial_completo',
    label: 'Pack Mundial Completo',
    price: 150000,
    description: 'Los 104 partidos del Mundial 2026',
    emoji: '🌍',
    color: '#6366F1',
  },
];

const formatPrice = (amount: number) => `$${amount.toLocaleString('es-CO')}`;

/* =============================================================================
   MODAL DE PAGO
   ============================================================================= */
function PaymentModal({ isOpen, onClose, item, leagueId, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  item: { label: string; price: number; matchId?: string; packageId?: string };
  leagueId: string;
  onSuccess: () => void;
}) {
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setUploading(true);
    try {
      // In a real scenario, upload file to S3/Cloudinary first
      // For now, we create the purchase record
      let voucherUrl = '';
      if (voucherFile) {
        // Simple base64 for now — in production use presigned URL
        voucherUrl = `voucher_${Date.now()}_${voucherFile.name}`;
      }

      await api.post(`/leagues/${leagueId}/match-purchases`, {
        matchId: item.matchId || null,
        packageId: item.packageId || null,
        amount: item.price,
        voucherUrl,
      });

      setSubmitted(true);
      toast.success('Comprobante enviado exitosamente');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar comprobante');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1E293B] border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-white font-black uppercase text-lg">{submitted ? '¡Enviado!' : 'Comprar Partido'}</h3>
            <p className="text-slate-400 text-xs">{item.label}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in duration-300">
              <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-white font-black text-xl uppercase">¡Comprobante Enviado!</h3>
              <p className="text-slate-400 text-sm max-w-xs">
                En menos de 2 horas tu partido estará habilitado para activar.
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> PROCESANDO...
              </div>
            </div>
          ) : (
            <>
              {/* Precio */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total a Pagar</p>
                <p className="text-3xl font-black text-emerald-400 font-mono">{formatPrice(item.price)}</p>
              </div>

              {/* Datos Bancarios */}
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Datos de Pago</p>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs">📱 Nequi/Daviplata</span>
                    <span className="text-white font-bold text-sm font-mono">310 597 3421</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs">🏦 Bancolombia</span>
                    <span className="text-white font-bold text-sm font-mono">272 2825 8721</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 mt-2">
                    <p className="text-emerald-400 text-xs font-bold text-center">A nombre de: Rafael Caro</p>
                  </div>
                </div>
              </div>

              {/* Upload Comprobante */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Subir Comprobante</p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 hover:border-emerald-500 rounded-xl p-6 cursor-pointer transition-colors group">
                  <Upload size={24} className="text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                  <span className="text-slate-400 text-xs group-hover:text-white transition-colors">
                    {voucherFile ? voucherFile.name : 'Toca para seleccionar archivo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setVoucherFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {/* Botón Enviar */}
              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase py-6 rounded-xl shadow-lg shadow-emerald-500/20 text-sm"
              >
                {uploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <ShoppingCart className="mr-2" size={18} />}
                Enviar Comprobante
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   COMPONENTE PRINCIPAL
   ============================================================================= */
export function MatchAdminPanel({ league, onUpdate }: MatchAdminPanelProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'packages' | 'control'>('control');
  const [matches, setMatches] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const { tournamentId } = useTournament();
  const [localTournamentId, setLocalTournamentId] = useState<string>(league?.tournamentId || tournamentId || 'WC2026');

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    item: { label: string; price: number; matchId?: string; packageId?: string };
  }>({ isOpen: false, item: { label: '', price: 0 } });

  const [stats, setStats] = useState({
    totalParticipants: 0,
    activeTable: 'Mesa 1',
    popularPrediction: 'Local Gana',
    distribution: { home: 45, draw: 30, away: 25 }
  });

  useEffect(() => {
    fetchMatches();
    fetchPurchases();
    if (league?.activeMatchId) {
       fetchStats();
    }
  }, [localTournamentId, league?.activeMatchId]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get(`/leagues/${league.id}/match-mode/stats`);
      if (data) setStats(data);
    } catch (e) {
      console.log('No se pudieron obtener stats reales, usando fallback mockup');
    }
  };

  const fetchMatches = async () => {
    try {
      const { data } = await api.get(`/matches?tournamentId=${localTournamentId}`);
      setMatches(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPurchases = async () => {
    try {
      const { data } = await api.get(`/leagues/${league.id}/match-purchases`);
      setPurchases(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivateMatch = async (matchId: string) => {
    try {
      setLoading(true);
      await api.patch(`/leagues/${league.id}/match-mode/activate-match`, { matchId });
      toast.success('Partido Activo configurado');
      onUpdate();
    } catch (e) {
      toast.error('Error al configurar partido');
    } finally {
      setLoading(false);
    }
  };

  const toggleTableNumbers = async () => {
    try {
      setLoading(true);
      const newStatus = !league.showTableNumbers;
      await api.patch(`/leagues/${league.id}`, { showTableNumbers: newStatus });
      toast.success(newStatus ? 'Modo Mesas: ON' : 'Modo Mesas: OFF');
      onUpdate();
    } catch (e) {
      toast.error('Error al actualizar config de mesas');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRanking = async () => {
    if (!confirm('¿Estás seguro de resetear los puntos de todos?')) return;
    try {
      setLoading(true);
      await api.post(`/leagues/${league.id}/match-mode/reset-ranking`, { confirm: true });
      toast.success('Ranking Reseteado localmente a 0');
      onUpdate();
    } catch (e) {
      toast.error('Error al resetear ranking');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/match/${league.matchCode}`);
    toast.success('Enlace de la mesa copiado al portapapeles');
  };

  const downloadQR = () => {
    const svg = document.getElementById('match-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-Polla-Match-${league.matchCode}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // --- DERIVED DATA ---
  const purchasedMatchIds = useMemo(() => {
    return new Set(purchases.filter(p => p.status === 'APPROVED' && p.matchId).map(p => p.matchId));
  }, [purchases]);

  const pendingMatchIds = useMemo(() => {
    return new Set(purchases.filter(p => p.status === 'PENDING' && p.matchId).map(p => p.matchId));
  }, [purchases]);

  const approvedPackageIds = useMemo(() => {
    return new Set(purchases.filter(p => p.status === 'APPROVED' && p.packageId).map(p => p.packageId));
  }, [purchases]);

  const pendingPackageIds = useMemo(() => {
    return new Set(purchases.filter(p => p.status === 'PENDING' && p.packageId).map(p => p.packageId));
  }, [purchases]);

  const getMatchStatus = (matchId: string) => {
    if (league.activeMatchId === matchId) return 'ACTIVE';
    if (purchasedMatchIds.has(matchId)) return 'ENABLED';
    if (pendingMatchIds.has(matchId)) return 'PENDING';
    return 'LOCKED';
  };

  const getMatchPrice = (match: any) => {
    const teams = `${match.homeTeam} ${match.awayTeam}`.toLowerCase();
    if (teams.includes('colombia')) return MATCH_PRICES.colombia;
    if (match.stage && ['QUARTER', 'SEMI', 'FINAL', 'THIRD_PLACE'].some(s => match.stage?.includes(s))) return MATCH_PRICES.knockout;
    return MATCH_PRICES.regular;
  };

  // Group matches by date
  const matchesByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    matches.forEach(m => {
      const dateKey = new Date(m.date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', month: 'short', day: 'numeric' });
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(m);
    });
    return grouped;
  }, [matches]);

  const TABS = [
    { id: 'matches' as const, label: 'Partidos' },
    { id: 'packages' as const, label: 'Paquetes' },
    { id: 'control' as const, label: 'Control' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex bg-slate-800 p-1 rounded-xl gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PESTAÑA 1: PARTIDOS */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {/* SELECTOR DE TORNEO EN PARTIDOS */}
          <div className="flex gap-2">
              <button 
                onClick={() => setLocalTournamentId('WC2026')}
                className={`flex-1 p-3 rounded-lg border-2 text-xs font-bold uppercase transition-all ${localTournamentId === 'WC2026' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              >
                  Mundial 2026
              </button>
              <button 
                onClick={() => setLocalTournamentId('UCL2526')}
                className={`flex-1 p-3 rounded-lg border-2 text-xs font-bold uppercase transition-all ${localTournamentId === 'UCL2526' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              >
                  Champions 25/26
              </button>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <h3 className="text-white font-bold uppercase text-xs mb-1 flex items-center gap-2">
              <Gamepad2 size={14} className="text-emerald-500" /> Comprar Partidos Individuales
            </h3>
            <p className="text-slate-500 text-[10px]">Compra partidos para habilitarlos, luego actívalos desde la pestaña Control.</p>
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 px-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1"><Lock size={10} className="text-slate-600" /> No comprado</span>
            <span className="text-[10px] text-yellow-500 flex items-center gap-1"><Clock size={10} /> Pendiente</span>
            <span className="text-[10px] text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Habilitado</span>
            <span className="text-[10px] text-red-500 flex items-center gap-1"><Zap size={10} /> Activo</span>
          </div>

          {Object.entries(matchesByDate).map(([date, dateMatches]) => (
            <div key={date} className="border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 transition-colors"
              >
                <span className="text-white font-bold text-xs uppercase">{date}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px]">{dateMatches.length} partidos</span>
                  <ChevronDown size={14} className={`text-slate-500 transition-transform ${expandedDate === date ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandedDate === date && (
                <div className="divide-y divide-slate-700/50">
                  {dateMatches.map((m: any) => {
                    const status = getMatchStatus(m.id);
                    const price = getMatchPrice(m);

                    return (
                      <div key={m.id} className={`flex items-center justify-between p-3 transition-colors ${
                        status === 'ACTIVE' ? 'bg-emerald-500/5' :
                        status === 'ENABLED' ? 'bg-slate-800/50' : 'bg-slate-900'
                      }`}>
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold uppercase">{m.homeTeam} vs {m.awayTeam}</p>
                          <p className="text-slate-500 text-[10px]">
                            {new Date(m.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}
                            {m.stage && <span className="ml-2 text-slate-600">{m.stage}</span>}
                          </p>
                        </div>
                        <div className="ml-3 shrink-0">
                          {status === 'LOCKED' && (
                            <button
                              onClick={() => setPaymentModal({
                                isOpen: true,
                                item: { label: `${m.homeTeam} vs ${m.awayTeam}`, price, matchId: m.id }
                              })}
                              className="bg-slate-800 hover:bg-emerald-500/20 border border-slate-600 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                            >
                              <ShoppingCart size={12} /> {formatPrice(price)}
                            </button>
                          )}
                          {status === 'PENDING' && (
                            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                              <Clock size={12} /> Pendiente
                            </span>
                          )}
                          {status === 'ENABLED' && (
                            <button
                              onClick={() => handleActivateMatch(m.id)}
                              className="bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/50 text-emerald-400 hover:text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                            >
                              <Zap size={12} /> Activar
                            </button>
                          )}
                          {status === 'ACTIVE' && (
                            <span className="bg-emerald-500 text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 animate-pulse shadow-lg shadow-emerald-500/30">
                              🔴 ACTIVO
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {matches.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm italic">Cargando partidos del torneo...</div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* PESTAÑA 2: PAQUETES */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <h3 className="text-white font-bold uppercase text-xs mb-1 flex items-center gap-2">
              <Package size={14} className="text-emerald-500" /> Paquetes de Partidos
            </h3>
            <p className="text-slate-500 text-[10px]">Ahorra comprando paquetes de múltiples partidos a precio especial.</p>
          </div>

          <div className="grid gap-4">
            {MATCH_PACKAGES.map(pkg => {
              const isPending = pendingPackageIds.has(pkg.id);
              const isApproved = approvedPackageIds.has(pkg.id);

              return (
                <div
                  key={pkg.id}
                  className={`relative bg-slate-900 border rounded-2xl p-6 overflow-hidden transition-all ${
                    isApproved ? 'border-emerald-500/50' : isPending ? 'border-yellow-500/30' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {/* Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10 pointer-events-none" style={{ backgroundColor: pkg.color }} />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-black text-white uppercase flex items-center gap-2">
                          <span className="text-2xl">{pkg.emoji}</span> {pkg.label}
                        </h4>
                        <p className="text-slate-400 text-sm mt-1">{pkg.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black font-mono" style={{ color: pkg.color }}>{formatPrice(pkg.price)}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Pago Único</p>
                      </div>
                    </div>

                    {isApproved ? (
                      <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-bold">
                        <CheckCircle size={16} /> Paquete Habilitado
                      </div>
                    ) : isPending ? (
                      <div className="flex items-center justify-center gap-2 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 text-sm font-bold">
                        <Clock size={16} /> Pendiente de Aprobación
                      </div>
                    ) : (
                      <Button
                        onClick={() => setPaymentModal({
                          isOpen: true,
                          item: { label: pkg.label, price: pkg.price, packageId: pkg.id }
                        })}
                        className="w-full text-slate-900 font-black uppercase py-4 rounded-xl shadow-lg text-sm"
                        style={{ backgroundColor: pkg.color }}
                      >
                        <ShoppingCart size={16} className="mr-2" /> Comprar Paquete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* PESTAÑA 3: CONTROL (Panel Original) */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'control' && (
        <div className="space-y-6">
          {/* Active Match Selection */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-bold uppercase mb-4 text-xs">Seleccionar Partido Activo</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {matches.filter(m => getMatchStatus(m.id) === 'ENABLED' || getMatchStatus(m.id) === 'ACTIVE').length > 0 ? (
                matches.filter(m => getMatchStatus(m.id) === 'ENABLED' || getMatchStatus(m.id) === 'ACTIVE').map((m) => (
                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${league.activeMatchId === m.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500'}`} onClick={() => handleActivateMatch(m.id)}>
                    <div className="text-sm font-bold text-white uppercase">{m.homeTeam} VS {m.awayTeam}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(m.date).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Lock size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No hay partidos habilitados.</p>
                  <p className="text-xs text-slate-600 mt-1">Ve a la pestaña "Partidos" o "Paquetes" para comprar y habilitar partidos.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                <h3 className="text-white font-bold uppercase mb-2 text-xs">Acciones</h3>
                <Button 
                  onClick={() => window.open(`/match/${league.matchCode}/tv`, '_blank')} 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold mb-3 flex gap-2"
                >
                  <Tv size={16} /> Abrir TV Dashboard
                </Button>
                
                <Button 
                  onClick={handleResetRanking}
                  variant="destructive"
                  className="w-full text-white font-bold flex gap-2"
                >
                  <RefreshCcw size={16} /> Resetear Ranking (Nuevo Partido)
                </Button>
                <p className="text-slate-500 text-[10px] text-center mt-2">Borrará todos los puntos de la liga actual.</p>
              </div>

              {/* NEW TOGGLE for Modo Mesas */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex justify-between items-center">
                 <div>
                    <h3 className="text-white font-bold text-sm">🪑 Modo Mesas</h3>
                    <p className="text-slate-500 text-[10px] mt-1">Pedir de mesa a los jugadores</p>
                 </div>
                 <Button 
                    onClick={toggleTableNumbers}
                    className={`font-black uppercase py-2 px-4 rounded-xl shadow-lg text-sm ${league.showTableNumbers ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600'}`}
                 >
                    {league.showTableNumbers ? 'ON 🟢' : 'OFF ⚪'}
                 </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center space-y-4">
              <h3 className="text-white font-bold uppercase text-xs text-center">
                Código QR {league.showTableNumbers ? 'para Mesas' : 'de Acceso'}
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <QRCodeSVG
                  id="match-qr"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/match/${league.matchCode}`}
                  size={150}
                  level="Q"
                  includeMargin={true}
                />
              </div>
              <p className="text-emerald-400 font-mono font-bold tracking-widest bg-emerald-500/10 px-4 py-2 border border-emerald-500/20 rounded m-0">
                CODE: {league.matchCode}
              </p>
              
              <div className="flex w-full gap-2 mt-2">
                <Button size="sm" variant="outline" className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-800 flex gap-2" onClick={copyLink}>
                  <Copy size={14} /> Copiar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex gap-2" onClick={downloadQR}>
                  <Download size={14} /> Descargar
                </Button>
              </div>

              <Button size="sm" variant="link" className="text-slate-400 text-xs w-full" onClick={() => window.open(`/match/${league.matchCode}`, '_blank')}>
                Probar enlace en nueva pestaña
              </Button>
            </div>
          </div>

          {/* Estadísticas del Partido */}
          {league.activeMatchId && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mt-6">
              <h3 className="text-white font-bold uppercase mb-4 text-xs flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-500" /> Estadísticas del Partido Actual
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <Users size={20} className="text-blue-400 mb-2" />
                  <span className="text-2xl font-black text-white">{stats.totalParticipants}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Participantes</span>
                </div>
                
                <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <Tv size={20} className="text-purple-400 mb-2" />
                  <span className="text-lg font-black text-white">{stats.activeTable}</span>
                  <div className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                    {league.showTableNumbers ? 'Mesa Más Activa' : 'Más Activo'}
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <Star size={20} className="text-yellow-400 mb-2" />
                  <span className="text-lg font-black text-teal-300">{stats.popularPrediction}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Más Popular</span>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <PieChart size={20} className="text-pink-400 mb-2" />
                  <div className="w-full flex h-2 rounded overflow-hidden mt-1 mb-2">
                    <div style={{ width: `${stats.distribution.home}%` }} className="bg-emerald-500" title={`Local ${stats.distribution.home}%`}></div>
                    <div style={{ width: `${stats.distribution.draw}%` }} className="bg-slate-400" title={`Empate ${stats.distribution.draw}%`}></div>
                    <div style={{ width: `${stats.distribution.away}%` }} className="bg-red-500" title={`Visitante ${stats.distribution.away}%`}></div>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    L: {stats.distribution.home}% | E: {stats.distribution.draw}% | V: {stats.distribution.away}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, item: { label: '', price: 0 } })}
        item={paymentModal.item}
        leagueId={league.id}
        onSuccess={() => {
          fetchPurchases();
          onUpdate();
        }}
      />
    </div>
  );
}
