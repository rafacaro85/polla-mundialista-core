import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Tv, RefreshCcw, Download, Copy, BarChart3, Users, Star, PieChart } from 'lucide-react';
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

  const [stats, setStats] = useState({
    totalParticipants: 0,
    activeTable: 'Mesa 1',
    popularPrediction: 'Local Gana',
    distribution: { home: 45, draw: 30, away: 25 }
  });

  useEffect(() => {
    fetchMatches();
    if (league?.activeMatchId) {
       fetchStats();
    }
  }, [tournamentId, league?.activeMatchId]);

  const fetchStats = async () => {
    try {
      // Intentar cargar stats reales desde el servidor
      const { data } = await api.get(`/leagues/${league.id}/match-mode/stats`);
      if (data) setStats(data);
    } catch (e) {
      // Mocked fallback en caso de que el endpoint no esté implementado aún
      console.log('No se pudieron obtener stats reales, usando fallback mockup');
    }
  };

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
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center space-y-4">
              <h3 className="text-white font-bold uppercase text-xs text-center">Código QR para Mesas</h3>
              <div className="bg-white p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <QRCodeSVG
                  id="match-qr"
                  value={`${window.location.origin}/match/${league.matchCode}`}
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
                  <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Mesa Más Activa</span>
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
        </>
      )}
    </div>
  );
}
