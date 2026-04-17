import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Tv, RefreshCcw, Download, Copy, BarChart3, Users, Star, PieChart, ShoppingCart, Package, Gamepad2, Lock, Clock, CheckCircle, Zap, Upload, X, ChevronDown, Minus, Plus, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTournament } from '@/hooks/useTournament';

interface MatchAdminPanelProps {
  league: any;
  onUpdate: () => void;
}

/* =============================================================================
   PRICING (mirror del backend)
   ============================================================================= */
const MATCH_BASE_PRICES = { regular: 15000, premium: 25000 };

const PARTICIPANT_PRICING = [
  { min: 20, max: 50,  pricePerPerson: 600 },
  { min: 51, max: 100, pricePerPerson: 500 },
  { min: 101, max: 300, pricePerPerson: 400 },
];

const MINIMUM_PARTICIPANTS = 20;
const MAXIMUM_PARTICIPANTS = 300;

const MATCH_PACKAGES = [
  { id: 'pack_colombia_grupos', label: 'Pack Colombia Grupos', basePrice: 60000, description: 'Todos los partidos de Colombia en fase de grupos', emoji: '🇨🇴', color: '#FACC15' },
  { id: 'pack_knockouts', label: 'Pack Eliminatorias', basePrice: 90000, description: 'Cuartos de final + Semis + Final', emoji: '🏆', color: '#00E676' },
  { id: 'pack_mundial_completo', label: 'Pack Mundial Completo', basePrice: 150000, description: 'Los 104 partidos del Mundial 2026', emoji: '🌍', color: '#6366F1' },
];

function getMatchBasePrice(match: any): number {
  const teams = `${match.homeTeam} ${match.awayTeam}`.toLowerCase();
  const isColombia = teams.includes('colombia');
  const isKnockout = match.stage && ['QUARTER', 'SEMI', 'FINAL', 'THIRD_PLACE'].some(s => match.stage?.includes(s));
  return (isColombia || isKnockout) ? MATCH_BASE_PRICES.premium : MATCH_BASE_PRICES.regular;
}

function calculatePrice(participants: number, basePrice: number) {
  if (participants < MINIMUM_PARTICIPANTS) participants = MINIMUM_PARTICIPANTS;
  if (participants > MAXIMUM_PARTICIPANTS) participants = MAXIMUM_PARTICIPANTS;
  const tier = PARTICIPANT_PRICING.find(t => participants >= t.min && participants <= t.max);
  const pricePerPerson = tier?.pricePerPerson || 400;
  const participantsCost = participants * pricePerPerson;
  return { participants, pricePerPerson, participantsCost, matchBasePrice: basePrice, totalPrice: basePrice + participantsCost };
}

const formatPrice = (amount: number) => `$${amount.toLocaleString('es-CO')}`;

/* =============================================================================
   TYPES
   ============================================================================= */
interface CartItem {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  participants: number;
  matchBasePrice: number;
  pricePerPerson: number;
  participantsCost: number;
  subtotal: number;
  packageId?: string;
}

/* =============================================================================
   MODAL: AGREGAR PARTIDO AL CARRITO
   ============================================================================= */
function AddToCartModal({ isOpen, onClose, match, onAdd }: {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  onAdd: (item: CartItem) => void;
}) {
  const [participants, setParticipants] = useState(20);

  if (!isOpen || !match) return null;

  const basePrice = getMatchBasePrice(match);
  const calc = calculatePrice(participants, basePrice);
  const isPremium = basePrice === MATCH_BASE_PRICES.premium;

  const matchDate = new Date(match.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' });
  const matchTime = new Date(match.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });

  const handleAdd = () => {
    onAdd({
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: match.date,
      participants: calc.participants,
      matchBasePrice: basePrice,
      pricePerPerson: calc.pricePerPerson,
      participantsCost: calc.participantsCost,
      subtotal: calc.totalPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1E293B] border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-white font-black uppercase text-lg">Agregar al Carrito</h3>
            <p className="text-slate-400 text-xs mt-0.5">{matchDate} - {matchTime}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Match Info */}
          <div className={`border rounded-2xl p-4 text-center ${isPremium ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-900 border-slate-700'}`}>
            <p className="text-white font-black text-xl uppercase tracking-tight">
              {match.homeTeam} <span className="text-slate-500 mx-2">vs</span> {match.awayTeam}
            </p>
            {isPremium && <p className="text-amber-400 text-[10px] font-bold uppercase mt-1">⭐ Partido Premium</p>}
          </div>

          {/* Participants Selector — de 1 en 1 */}
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">¿Para cuántos participantes?</p>
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={() => setParticipants(Math.max(MINIMUM_PARTICIPANTS, participants - 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <Minus size={18} />
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  value={participants}
                  onChange={e => {
                    const v = parseInt(e.target.value) || MINIMUM_PARTICIPANTS;
                    setParticipants(Math.min(MAXIMUM_PARTICIPANTS, Math.max(MINIMUM_PARTICIPANTS, v)));
                  }}
                  className="w-24 text-center bg-slate-900 border border-emerald-500 rounded-xl text-3xl font-black text-white py-2 outline-none"
                  min={MINIMUM_PARTICIPANTS}
                  max={MAXIMUM_PARTICIPANTS}
                />
                <p className="text-slate-500 text-[10px] mt-1">Min: {MINIMUM_PARTICIPANTS} | Max: {MAXIMUM_PARTICIPANTS}</p>
              </div>
              <button
                onClick={() => setParticipants(Math.min(MAXIMUM_PARTICIPANTS, participants + 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">⚽ Partido {isPremium ? '(Premium)' : '(Regular)'}</span>
              <span className="text-white font-bold">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm flex items-center gap-2"><Users size={14} /> {calc.participants} participantes × {formatPrice(calc.pricePerPerson)}</span>
              <span className="text-white font-bold">{formatPrice(calc.participantsCost)}</span>
            </div>
            <div className="border-t border-emerald-500/20 pt-3 mt-2 flex justify-between items-center">
              <span className="text-white font-bold text-sm">💵 Total</span>
              <span className="text-emerald-400 font-black text-2xl font-mono">{formatPrice(calc.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 font-bold text-sm uppercase hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors"
          >
            <ShoppingCart size={16} /> Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   MODAL: AGREGAR PAQUETE AL CARRITO
   ============================================================================= */
function AddPackageModal({ isOpen, onClose, pkg, onAdd }: {
  isOpen: boolean;
  onClose: () => void;
  pkg: typeof MATCH_PACKAGES[0] | null;
  onAdd: (item: CartItem) => void;
}) {
  const [participants, setParticipants] = useState(20);

  if (!isOpen || !pkg) return null;

  const calc = calculatePrice(participants, pkg.basePrice);

  const handleAdd = () => {
    onAdd({
      matchId: pkg.id,
      homeTeam: pkg.label,
      awayTeam: '',
      date: new Date().toISOString(),
      participants: calc.participants,
      matchBasePrice: pkg.basePrice,
      pricePerPerson: calc.pricePerPerson,
      participantsCost: calc.participantsCost,
      subtotal: calc.totalPrice,
      packageId: pkg.id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1E293B] border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-white font-black uppercase text-lg">Agregar Paquete</h3>
            <p className="text-slate-400 text-xs mt-0.5">{pkg.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-center">
            <span className="text-4xl block mb-2">{pkg.emoji}</span>
            <p className="text-white font-black text-lg uppercase">{pkg.label}</p>
            <p className="text-slate-400 text-xs mt-1">{pkg.description}</p>
          </div>

          {/* Participants Selector */}
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">¿Para cuántos participantes?</p>
            <div className="flex items-center gap-4 justify-center">
              <button onClick={() => setParticipants(Math.max(MINIMUM_PARTICIPANTS, participants - 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 flex items-center justify-center transition-colors">
                <Minus size={18} />
              </button>
              <div className="flex-1 text-center">
                <input type="number" value={participants}
                  onChange={e => { const v = parseInt(e.target.value) || MINIMUM_PARTICIPANTS; setParticipants(Math.min(MAXIMUM_PARTICIPANTS, Math.max(MINIMUM_PARTICIPANTS, v))); }}
                  className="w-24 text-center bg-slate-900 border border-emerald-500 rounded-xl text-3xl font-black text-white py-2 outline-none"
                  min={MINIMUM_PARTICIPANTS} max={MAXIMUM_PARTICIPANTS} />
                <p className="text-slate-500 text-[10px] mt-1">Min: {MINIMUM_PARTICIPANTS} | Max: {MAXIMUM_PARTICIPANTS}</p>
              </div>
              <button onClick={() => setParticipants(Math.min(MAXIMUM_PARTICIPANTS, participants + 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 flex items-center justify-center transition-colors">
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">📦 Paquete base</span>
              <span className="text-white font-bold">{formatPrice(pkg.basePrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm flex items-center gap-2"><Users size={14} /> {calc.participants} part. × {formatPrice(calc.pricePerPerson)}</span>
              <span className="text-white font-bold">{formatPrice(calc.participantsCost)}</span>
            </div>
            <div className="border-t border-emerald-500/20 pt-3 mt-2 flex justify-between items-center">
              <span className="text-white font-bold text-sm">💵 Total</span>
              <span className="text-emerald-400 font-black text-2xl font-mono">{formatPrice(calc.totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 font-bold text-sm uppercase hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <button onClick={handleAdd}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors">
            <ShoppingCart size={16} /> Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   PANEL DEL CARRITO
   ============================================================================= */
function CartPanel({ isOpen, onClose, cart, onRemove, onCheckout }: {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemove: (matchId: string) => void;
  onCheckout: () => void;
}) {
  if (!isOpen) return null;
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h3 className="text-white font-black uppercase text-lg flex items-center gap-2">
            🛒 Mi Carrito <span className="text-emerald-400 text-sm">({cart.length})</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 font-bold">Tu carrito está vacío</p>
              <p className="text-slate-500 text-xs mt-1">Agrega partidos o paquetes</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.matchId} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm uppercase truncate">
                    {item.packageId ? `📦 ${item.homeTeam}` : `⚽ ${item.homeTeam} vs ${item.awayTeam}`}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-0.5">
                    {!item.packageId && new Date(item.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })}
                    {' · '}{item.participants} personas
                  </p>
                  <p className="text-emerald-400 font-bold text-sm mt-1">{formatPrice(item.subtotal)}</p>
                </div>
                <button onClick={() => onRemove(item.matchId)}
                  className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-700 shrink-0 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-sm">Total a pagar:</span>
              <span className="text-emerald-400 font-black text-2xl font-mono">{formatPrice(total)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 font-bold text-sm uppercase hover:bg-slate-800 transition-colors">
                Seguir Comprando
              </button>
              <button onClick={onCheckout}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors">
                💳 Proceder al Pago
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =============================================================================
   CHECKOUT MODAL
   ============================================================================= */
function CheckoutModal({ isOpen, onClose, cart, leagueId, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  leagueId: string;
  onSuccess: () => void;
}) {
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async () => {
    setUploading(true);
    try {
      let voucherUrl = '';
      if (voucherFile) voucherUrl = `voucher_${Date.now()}_${voucherFile.name}`;

      await api.post(`/leagues/${leagueId}/match-purchases`, {
        items: cart,
        totalAmount: total,
        voucherUrl,
      });

      setSubmitted(true);
      toast.success('¡Comprobante enviado exitosamente!');
      setTimeout(() => { onSuccess(); onClose(); setSubmitted(false); setVoucherFile(null); }, 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar comprobante');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1E293B] border border-slate-700 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-[#1E293B] z-10">
          <div>
            <h3 className="text-white font-black uppercase text-lg">{submitted ? '¡Enviado!' : 'Finalizar Compra'}</h3>
            <p className="text-slate-400 text-xs">{cart.length} item{cart.length > 1 ? 's' : ''} en el carrito</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in duration-300">
              <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500"><CheckCircle size={40} /></div>
              <h3 className="text-white font-black text-xl uppercase">¡Comprobante Enviado!</h3>
              <p className="text-slate-400 text-sm max-w-xs">En menos de 2 horas tus partidos estarán habilitados.</p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> PROCESANDO...
              </div>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Resumen del pedido</p>
                {cart.map(item => (
                  <div key={item.matchId} className="flex justify-between items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-white text-xs font-bold uppercase">{item.packageId ? `📦 ${item.homeTeam}` : `${item.homeTeam} vs ${item.awayTeam}`}</p>
                      <p className="text-slate-500 text-[10px]">{item.participants} personas</p>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total a Pagar</p>
                <p className="text-3xl font-black text-emerald-400 font-mono">{formatPrice(total)}</p>
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

              {/* Upload */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Subir Comprobante</p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 hover:border-emerald-500 rounded-xl p-6 cursor-pointer transition-colors group">
                  <Upload size={24} className="text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                  <span className="text-slate-400 text-xs group-hover:text-white transition-colors">
                    {voucherFile ? voucherFile.name : 'Toca para seleccionar archivo'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setVoucherFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <Button onClick={handleSubmit} disabled={uploading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase py-6 rounded-xl shadow-lg shadow-emerald-500/20 text-sm">
                {uploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <ShoppingCart className="mr-2" size={18} />}
                Enviar y Confirmar Pago
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
  const [activeTab, setActiveTab] = useState<'matches' | 'control'>('control');
  const [matchMode, setMatchMode] = useState<'individual' | 'packages'>('individual');
  const [localShowTableNumbers, setLocalShowTableNumbers] = useState<boolean>(league?.showTableNumbers ?? true);
  const [matches, setMatches] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const { tournamentId } = useTournament();
  const [localTournamentId, setLocalTournamentId] = useState<string>(league?.tournamentId || tournamentId || 'WC2026');

  // Cart
  const cartKey = `match_cart_${league?.id}`;
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try { const s = localStorage.getItem(cartKey); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [addToCartMatch, setAddToCartMatch] = useState<any>(null);
  const [addPackage, setAddPackage] = useState<typeof MATCH_PACKAGES[0] | null>(null);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(cartKey, JSON.stringify(cart)); }, [cart, cartKey]);

  const [stats, setStats] = useState({ totalParticipants: 0, activeTable: 'Mesa 1', popularPrediction: 'Local Gana', distribution: { home: 45, draw: 30, away: 25 } });

  useEffect(() => { fetchMatches(); fetchPurchases(); if (league?.activeMatchId) fetchStats(); }, [localTournamentId, league?.activeMatchId]);

  const fetchStats = async () => { try { const { data } = await api.get(`/leagues/${league.id}/match-mode/stats`); if (data) setStats(data); } catch {} };
  const fetchMatches = async () => { try { const { data } = await api.get(`/matches?tournamentId=${localTournamentId}`); setMatches(Array.isArray(data) ? data : []); } catch {} };
  const fetchPurchases = async () => { try { const { data } = await api.get(`/leagues/${league.id}/match-purchases`); setPurchases(Array.isArray(data) ? data : []); } catch {} };

  const handleActivateMatch = async (matchId: string) => {
    try { setLoading(true); await api.patch(`/leagues/${league.id}/match-mode/activate-match`, { matchId }); toast.success('Partido Activo configurado'); onUpdate(); } catch { toast.error('Error al configurar partido'); } finally { setLoading(false); }
  };
  const toggleTableNumbers = async () => {
    try { setLoading(true); const n = !localShowTableNumbers; await api.patch(`/leagues/${league.id}`, { showTableNumbers: n }); setLocalShowTableNumbers(n); toast.success(n ? 'Modo Mesas: ON' : 'Modo Mesas: OFF'); } catch { toast.error('Error al actualizar'); } finally { setLoading(false); }
  };
  const handleResetRanking = async () => {
    if (!confirm('¿Estás seguro de resetear los puntos de todos?')) return;
    try { setLoading(true); await api.post(`/leagues/${league.id}/match-mode/reset-ranking`, { confirm: true }); toast.success('Ranking Reseteado'); onUpdate(); } catch { toast.error('Error al resetear'); } finally { setLoading(false); }
  };
  const copyLink = () => { navigator.clipboard.writeText(`${window.location.origin}/match/${league.matchCode}`); toast.success('Enlace copiado'); };
  const downloadQR = () => {
    const svg = document.getElementById('match-qr'); if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image();
    img.onload = () => { canvas.width = img.width; canvas.height = img.height; if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); const pngFile = canvas.toDataURL('image/png'); const dl = document.createElement('a'); dl.download = `QR-Polla-Match-${league.matchCode}.png`; dl.href = pngFile; dl.click(); } };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Cart ops
  const addToCart = (item: CartItem) => {
    setCart(prev => { if (prev.find(i => i.matchId === item.matchId)) { toast.info('Ya está en el carrito'); return prev; } toast.success('Agregado al carrito'); return [...prev, item]; });
  };
  const removeFromCart = (matchId: string) => { setCart(prev => prev.filter(i => i.matchId !== matchId)); toast.info('Eliminado del carrito'); };
  const handleCheckoutSuccess = () => { setCart([]); setShowCheckout(false); setShowCart(false); fetchPurchases(); onUpdate(); };

  // Derived
  const cartMatchIds = useMemo(() => new Set(cart.map(i => i.matchId)), [cart]);
  const purchasedMatchIds = useMemo(() => {
    const s = new Set<string>(); purchases.forEach(p => { if (p.status === 'APPROVED') { if (p.matchId) s.add(p.matchId); if (p.items) p.items.forEach((i: any) => s.add(i.matchId)); } }); return s;
  }, [purchases]);
  const pendingMatchIds = useMemo(() => {
    const s = new Set<string>(); purchases.forEach(p => { if (p.status === 'PENDING') { if (p.matchId) s.add(p.matchId); if (p.items) p.items.forEach((i: any) => s.add(i.matchId)); } }); return s;
  }, [purchases]);
  const approvedPackageIds = useMemo(() => new Set(purchases.filter(p => p.status === 'APPROVED' && p.items?.some((i: any) => i.packageId)).flatMap(p => p.items.filter((i: any) => i.packageId).map((i: any) => i.packageId))), [purchases]);
  const pendingPackageIds = useMemo(() => new Set(purchases.filter(p => p.status === 'PENDING' && p.items?.some((i: any) => i.packageId)).flatMap(p => p.items.filter((i: any) => i.packageId).map((i: any) => i.packageId))), [purchases]);

  const getMatchStatus = (matchId: string) => {
    if (league.activeMatchId === matchId) return 'ACTIVE';
    if (purchasedMatchIds.has(matchId)) return 'ENABLED';
    if (pendingMatchIds.has(matchId)) return 'PENDING';
    if (cartMatchIds.has(matchId)) return 'IN_CART';
    return 'LOCKED';
  };

  const matchesByDate = useMemo(() => {
    const g: Record<string, any[]> = {};
    matches.forEach(m => { const d = new Date(m.date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', month: 'short', day: 'numeric' }); if (!g[d]) g[d] = []; g[d].push(m); });
    return g;
  }, [matches]);

  const TABS = [
    { id: 'matches' as const, label: 'Comprar' },
    { id: 'control' as const, label: 'Control' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation + Cart */}
      <div className="flex items-center gap-3">
        <div className="flex bg-slate-800 p-1 rounded-xl gap-1 flex-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center transition-all ${
                activeTab === tab.id ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}>{tab.label}</button>
          ))}
        </div>
        <button onClick={() => setShowCart(true)}
          className="relative w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-all shadow-lg">
          <ShoppingCart size={20} />
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center animate-bounce border-2 border-[#1E293B]">{cart.length}</span>
          )}
        </button>
      </div>

      {/* ═══ COMPRAR (PARTIDOS Y PAQUETES) ═══ */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex bg-slate-900 border border-slate-700 p-1 rounded-xl">
            <button onClick={() => setMatchMode('individual')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${matchMode === 'individual' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Partidos Individuales</button>
            <button onClick={() => setMatchMode('packages')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${matchMode === 'packages' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Paquetes Especiales</button>
          </div>

          {matchMode === 'individual' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex gap-2">
                <button onClick={() => setLocalTournamentId('WC2026')} className={`flex-1 p-3 rounded-lg border-2 text-xs font-bold uppercase transition-all ${localTournamentId === 'WC2026' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>Mundial 2026</button>
            <button onClick={() => setLocalTournamentId('UCL2526')} className={`flex-1 p-3 rounded-lg border-2 text-xs font-bold uppercase transition-all ${localTournamentId === 'UCL2526' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>Champions 25/26</button>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <h3 className="text-white font-bold uppercase text-xs mb-1 flex items-center gap-2"><Gamepad2 size={14} className="text-emerald-500" /> Comprar Partidos</h3>
            <p className="text-slate-500 text-[10px]">Selecciona partidos, elige participantes y agrégalos al carrito.</p>
          </div>

          <div className="flex flex-wrap gap-3 px-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1"><Lock size={10} className="text-slate-600" /> Sin comprar</span>
            <span className="text-[10px] text-blue-400 flex items-center gap-1"><ShoppingCart size={10} /> En carrito</span>
            <span className="text-[10px] text-yellow-500 flex items-center gap-1"><Clock size={10} /> Pendiente</span>
            <span className="text-[10px] text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Habilitado</span>
            <span className="text-[10px] text-red-500 flex items-center gap-1"><Zap size={10} /> Activo</span>
          </div>

          {Object.entries(matchesByDate).map(([date, dateMatches]) => (
            <div key={date} className="border border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedDate(expandedDate === date ? null : date)} className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 transition-colors">
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
                    const isPremium = getMatchBasePrice(m) === MATCH_BASE_PRICES.premium;
                    return (
                      <div key={m.id} className={`flex items-center justify-between p-3 transition-colors ${
                        status === 'ACTIVE' ? 'bg-emerald-500/5' : status === 'ENABLED' ? 'bg-slate-800/50' : status === 'IN_CART' ? 'bg-blue-500/5' : 'bg-slate-900'
                      }`}>
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold uppercase">
                            {m.homeTeam} vs {m.awayTeam}
                            {isPremium && <span className="text-amber-400 text-[10px] ml-2">⭐</span>}
                          </p>
                          <p className="text-slate-500 text-[10px]">
                            {new Date(m.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}
                            {m.stage && <span className="ml-2 text-slate-600">{m.stage}</span>}
                          </p>
                        </div>
                        <div className="ml-3 shrink-0">
                          {status === 'LOCKED' && (
                            <button onClick={() => setAddToCartMatch(m)}
                              className="bg-slate-800 hover:bg-emerald-500/20 border border-slate-600 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1">
                              <ShoppingCart size={12} /> Comprar
                            </button>
                          )}
                          {status === 'IN_CART' && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"><ShoppingCart size={12} /> En carrito</span>}
                          {status === 'PENDING' && <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"><Clock size={12} /> Pendiente</span>}
                          {status === 'ENABLED' && <button onClick={() => handleActivateMatch(m.id)} className="bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/50 text-emerald-400 hover:text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1"><Zap size={12} /> Activar</button>}
                          {status === 'ACTIVE' && <span className="bg-emerald-500 text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 animate-pulse shadow-lg shadow-emerald-500/30">🔴 ACTIVO</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {matches.length === 0 && <div className="text-center py-12 text-slate-500 text-sm italic">Cargando partidos del torneo...</div>}
            </div>
          )}

          {matchMode === 'packages' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <h3 className="text-white font-bold uppercase text-xs mb-1 flex items-center gap-2"><Package size={14} className="text-emerald-500" /> Paquetes de Partidos</h3>
                <p className="text-slate-500 text-[10px]">Compra paquetes especiales. Al seleccionar te pediremos la cantidad de participantes.</p>
              </div>

              <div className="grid gap-4">
                {MATCH_PACKAGES.map(pkg => {
                  const isPending = pendingPackageIds.has(pkg.id);
                  const isApproved = approvedPackageIds.has(pkg.id);
                  const isInCart = cartMatchIds.has(pkg.id);

                  return (
                    <div key={pkg.id} className={`relative bg-slate-900 border rounded-2xl p-6 overflow-hidden transition-all ${
                      isApproved ? 'border-emerald-500/50' : isPending ? 'border-yellow-500/30' : isInCart ? 'border-blue-500/30' : 'border-slate-700 hover:border-slate-500'
                    }`}>
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
                            <p className="text-xl font-black font-mono" style={{ color: pkg.color }}>Desde {formatPrice(pkg.basePrice)}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">+ participantes</p>
                          </div>
                        </div>

                        {isApproved ? (
                          <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-bold"><CheckCircle size={16} /> Paquete Habilitado</div>
                        ) : isPending ? (
                          <div className="flex items-center justify-center gap-2 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 text-sm font-bold"><Clock size={16} /> Pendiente de Aprobación</div>
                        ) : isInCart ? (
                          <div className="flex items-center justify-center gap-2 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-bold"><ShoppingCart size={16} /> En el carrito</div>
                        ) : (
                          <Button onClick={() => setAddPackage(pkg)} className="w-full text-slate-900 font-black uppercase py-4 rounded-xl shadow-lg text-sm" style={{ backgroundColor: pkg.color }}>
                            <ShoppingCart size={16} className="mr-2" /> Seleccionar Paquete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CONTROL ═══ */}
      {activeTab === 'control' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-bold uppercase mb-4 text-xs">Seleccionar Partido Activo</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {matches.filter(m => getMatchStatus(m.id) === 'ENABLED' || getMatchStatus(m.id) === 'ACTIVE').length > 0 ? (
                matches.filter(m => getMatchStatus(m.id) === 'ENABLED' || getMatchStatus(m.id) === 'ACTIVE').map(m => (
                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${league.activeMatchId === m.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500'}`} onClick={() => handleActivateMatch(m.id)}>
                    <div className="text-sm font-bold text-white uppercase">{m.homeTeam} VS {m.awayTeam}</div>
                    <div className="text-xs text-slate-400">{new Date(m.date).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm"><Lock size={24} className="mx-auto mb-2 opacity-50" /><p>No hay partidos habilitados.</p><p className="text-xs text-slate-600 mt-1">Ve a "Partidos" o "Paquetes" para comprar.</p></div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                <h3 className="text-white font-bold uppercase mb-2 text-xs">Acciones</h3>
                <Button onClick={() => window.open(`/match/${league.matchCode}/tv`, '_blank')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold mb-3 flex gap-2"><Tv size={16} /> Abrir TV Dashboard</Button>
                <Button onClick={handleResetRanking} variant="destructive" className="w-full text-white font-bold flex gap-2"><RefreshCcw size={16} /> Resetear Ranking</Button>
                <p className="text-slate-500 text-[10px] text-center mt-2">Borrará todos los puntos de la liga actual.</p>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex justify-between items-center">
                <div><h3 className="text-white font-bold text-sm">🪑 Modo Mesas</h3><p className="text-slate-500 text-[10px] mt-1">Pedir de mesa a los jugadores</p></div>
                <Button onClick={toggleTableNumbers} className={`font-black uppercase py-2 px-4 rounded-xl shadow-lg text-sm ${localShowTableNumbers ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600'}`}>
                  {localShowTableNumbers ? 'ON 🟢' : 'OFF ⚪'}
                </Button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center space-y-4">
              <h3 className="text-white font-bold uppercase text-xs text-center">Código QR {localShowTableNumbers ? 'para Mesas' : 'de Acceso'}</h3>
              <div className="bg-white p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <QRCodeSVG id="match-qr" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/match/${league.matchCode}`} size={150} level="Q" includeMargin={true} />
              </div>
              <p className="text-emerald-400 font-mono font-bold tracking-widest bg-emerald-500/10 px-4 py-2 border border-emerald-500/20 rounded m-0">CODE: {league.matchCode}</p>
              <div className="flex w-full gap-2 mt-2">
                <Button size="sm" variant="outline" className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-800 flex gap-2" onClick={copyLink}><Copy size={14} /> Copiar</Button>
                <Button size="sm" variant="outline" className="flex-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex gap-2" onClick={downloadQR}><Download size={14} /> Descargar</Button>
              </div>
              <Button size="sm" variant="link" className="text-slate-400 text-xs w-full" onClick={() => window.open(`/match/${league.matchCode}`, '_blank')}>Probar enlace</Button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mt-6">
            <h3 className="text-white font-bold uppercase mb-4 text-xs flex items-center gap-2"><BarChart3 size={16} className="text-emerald-500" /> Estadísticas del Partido Actual</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center"><Users size={20} className="text-blue-400 mb-2" /><span className="text-2xl font-black text-white">{stats.totalParticipants}</span><span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Participantes</span></div>
              <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center"><Tv size={20} className="text-purple-400 mb-2" /><span className="text-lg font-black text-white">{stats.activeTable}</span><div className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">{localShowTableNumbers ? 'Mesa Más Activa' : 'Más Activo'}</div></div>
              <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center"><Star size={20} className="text-yellow-400 mb-2" /><span className="text-lg font-black text-teal-300">{stats.popularPrediction}</span><span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Más Popular</span></div>
              <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <PieChart size={20} className="text-pink-400 mb-2" />
                <div className="w-full flex h-2 rounded overflow-hidden mt-1 mb-2">
                  <div style={{ width: `${stats.distribution.home}%` }} className="bg-emerald-500"></div>
                  <div style={{ width: `${stats.distribution.draw}%` }} className="bg-slate-400"></div>
                  <div style={{ width: `${stats.distribution.away}%` }} className="bg-red-500"></div>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">L: {stats.distribution.home}% | E: {stats.distribution.draw}% | V: {stats.distribution.away}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddToCartModal isOpen={!!addToCartMatch} onClose={() => setAddToCartMatch(null)} match={addToCartMatch} onAdd={addToCart} />
      <AddPackageModal isOpen={!!addPackage} onClose={() => setAddPackage(null)} pkg={addPackage} onAdd={addToCart} />
      <CartPanel isOpen={showCart} onClose={() => setShowCart(false)} cart={cart} onRemove={removeFromCart} onCheckout={() => { setShowCart(false); setShowCheckout(true); }} />
      <CheckoutModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} cart={cart} leagueId={league.id} onSuccess={handleCheckoutSuccess} />
    </div>
  );
}
