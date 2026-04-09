import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Tv, RefreshCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTournament } from '@/hooks/useTournament';

interface MatchAdminPanelProps {
  league: any;
  onUpdate: () => void;
}

export function MatchAdminPanel({ league, onUpdate }: MatchAdminPanelProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const { tournamentId } = useTournament();

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      const { data } = await api.get(`/matches/live?tournamentId=${tournamentId}`);
      // Show all matches for selection, or fetch all from /matches?
      // Since it's one specific match, let's just get the live/recent ones
      if (data.length === 0) {
        const { data: allMatches } = await api.get(`/matches?tournamentId=${tournamentId}`);
        setMatches(allMatches.slice(0, 10)); // Just 10 to pick
      } else {
        setMatches(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleMatchMode = async (checked: boolean) => {
    try {
      setLoading(true);
      await api.patch(`/leagues/${league.id}/match-mode/toggle`, { isMatchMode: checked });
      toast.success(checked ? 'Polla Match Activado' : 'Polla Match Desactivado');
      onUpdate();
    } catch (e) {
      toast.error('Error actualizando Polla Match');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Toggle Match Mode */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold uppercase mb-1">Activar Modo Polla Match</h3>
          <p className="text-slate-400 text-xs">Ideal para bares. Un partido a la vez, escaneo por QR y TV en vivo.</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />}
          <button
            onClick={() => handleToggleMatchMode(!league.isMatchMode)}
            disabled={loading}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              league.isMatchMode ? 'bg-emerald-500' : 'bg-slate-600'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              league.isMatchMode ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {league.isMatchMode && (
        <>
          {/* Active Match Selection */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-bold uppercase mb-4 text-xs">Seleccionar Partido Activo</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {matches.map((m) => (
                <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${league.activeMatchId === m.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500'}`} onClick={() => handleActivateMatch(m.id)}>
                  <div className="text-sm font-bold text-white uppercase">{m.homeTeam} VS {m.awayTeam}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(m.date).toLocaleString()}
                  </div>
                </div>
              ))}
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
            </div>

            {/* QR Code */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center">
              <h3 className="text-white font-bold uppercase mb-4 text-xs text-center">Código QR para Mesas</h3>
              <div className="bg-white p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <QRCodeSVG
                  value={`${window.location.origin}/match/${league.matchCode}`}
                  size={150}
                  level="Q"
                  includeMargin={true}
                />
              </div>
              <p className="text-emerald-400 font-mono font-bold tracking-widest mt-4 bg-emerald-500/10 px-4 py-2 border border-emerald-500/20 rounded">
                CODE: {league.matchCode}
              </p>
              <Button size="sm" variant="link" className="text-slate-400 mt-2 text-xs" onClick={() => window.open(`/match/${league.matchCode}`, '_blank')}>
                Probar enlace
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
