'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical, 
  Image as ImageIcon, 
  DollarSign, 
  Save, 
  ChevronRight,
  Loader2,
  Trophy,
  Upload
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

import { useImageUpload } from '@/hooks/useImageUpload';

export default function AdminPrizesPage() {
  const { id: leagueId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prizes, setPrizes] = useState<any[]>([]);
  const { uploadingState, handleImageUpload } = useImageUpload();

  useEffect(() => {
    fetchPrizes();
  }, [leagueId]);

  const fetchPrizes = async () => {
    try {
      const { data } = await api.get(`/leagues/${leagueId}/extra/prizes`);
      setPrizes(data);
    } catch (error) {
      console.error('Error fetching prizes:', error);
      toast.error('Error al cargar la lista de premios');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrize = () => {
    const newPrize = {
      type: 'cash',
      badge: `${prizes.length + 1}ER PUESTO`,
      name: '',
      imageUrl: '',
      amount: 0,
      topLabel: 'PREMIO MAYOR',
      bottomLabel: 'AL GANADOR',
      order: prizes.length,
      isNew: true
    };
    setPrizes([...prizes, newPrize]);
  };

  const handleRemovePrize = async (index: number, prizeId?: string) => {
    if (prizeId) {
      if (!confirm('¿Estás seguro de eliminar este premio?')) return;
      try {
        await api.delete(`/leagues/${leagueId}/extra/prizes/${prizeId}`);
        toast.success('Premio eliminado');
      } catch (error) {
        toast.error('Error al eliminar');
        return;
      }
    }
    const newPrizes = [...prizes];
    newPrizes.splice(index, 1);
    setPrizes(newPrizes);
  };

  const handleSave = async (index: number) => {
    setSaving(true);
    const prize = prizes[index];
    try {
      if (prize.isNew) {
        const { data } = await api.post(`/leagues/${leagueId}/extra/prizes`, prize);
        const updated = [...prizes];
        updated[index] = { ...data, isNew: false };
        setPrizes(updated);
        toast.success('Premio creado');
      } else {
        await api.put(`/leagues/${leagueId}/extra/prizes/${prize.id}`, prize);
        toast.success('Premio actualizado');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el premio');
    } finally {
      setSaving(false);
    }
  };


  const updatePrize = (index: number, field: string, value: any) => {
    const updated = [...prizes];
    updated[index] = { ...updated[index], [field]: value };
    setPrizes(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push(`/leagues/${leagueId}/admin`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Volver al Panel</span>
          </button>
          <h1 className="text-2xl font-black uppercase italic flex items-center gap-3">
            <Trophy className="text-yellow-500" />
            Gestión de Premios
          </h1>
        </div>

        {/* List */}
        <div className="space-y-4">
          {prizes.map((prize, idx) => (
            <div key={prize.id || idx} className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Badge / Etiqueta</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                      value={prize.badge}
                      onChange={(e) => updatePrize(idx, 'badge', e.target.value)}
                      placeholder="Ej: 1ER PUESTO"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Nombre del Premio</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                      value={prize.name}
                      onChange={(e) => updatePrize(idx, 'name', e.target.value)}
                      placeholder="Ej: Camiseta Oficial"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Tipo de Premio</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updatePrize(idx, 'type', 'cash')}
                        className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${prize.type === 'cash' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-[#0F172A] border-slate-700 text-slate-500'}`}
                      >
                        <DollarSign size={14} /> Efectivo
                      </button>
                      <button 
                        onClick={() => updatePrize(idx, 'type', 'image')}
                        className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${prize.type === 'image' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-[#0F172A] border-slate-700 text-slate-500'}`}
                      >
                        <ImageIcon size={14} /> Imagen
                      </button>
                    </div>
                  </div>
                </div>

                {/* Values Info */}
                <div className="space-y-4">
                  {prize.type === 'cash' ? (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Monto (COP)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-indigo-400 font-bold">$</span>
                        <input 
                          type="number"
                          className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-lg font-russo text-indigo-400 outline-none"
                          value={prize.amount}
                          onChange={(e) => updatePrize(idx, 'amount', parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Texto Superior</label>
                          <input 
                            type="text"
                            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none"
                            value={prize.topLabel || 'PREMIO MAYOR'}
                            onChange={(e) => updatePrize(idx, 'topLabel', e.target.value)}
                            placeholder="Ej: GRAN BOTÍN"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Texto Inferior</label>
                          <input 
                            type="text"
                            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none"
                            value={prize.bottomLabel || 'AL GANADOR'}
                            onChange={(e) => updatePrize(idx, 'bottomLabel', e.target.value)}
                            placeholder="Ej: AL CAMPEÓN"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Imagen del Premio</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          className="flex-1 bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                          value={prize.imageUrl}
                          onChange={(e) => updatePrize(idx, 'imageUrl', e.target.value)}
                          placeholder="URL o sube una imagen..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e: any) => {
                              handleImageUpload(
                                `prize_${idx}`,
                                e,
                                (url) => updatePrize(idx, 'imageUrl', url),
                                'polla-virtual/prizes'
                              );
                            };
                            input.click();
                          }}
                          disabled={!!uploadingState[`prize_${idx}`]}
                          className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 rounded-xl hover:bg-indigo-600/30 transition-all flex items-center justify-center min-w-[50px]"
                          title="Subir Imagen"
                        >
                          {uploadingState[`prize_${idx}`] ? (
                             <Loader2 className="animate-spin" size={18} />
                          ) : (
                             <Upload size={18} />
                          )}
                        </button>
                      </div>
                      {prize.imageUrl && (
                        <div className="mt-4 h-32 rounded-xl overflow-hidden border border-slate-700 relative group bg-black/20">
                          <img src={prize.imageUrl} className="w-full h-full object-contain" alt="Preview" />
                          <button 
                            type="button"
                            onClick={() => updatePrize(idx, 'imageUrl', '')}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-6 border-t border-slate-700 flex justify-between items-center">
                <button 
                  onClick={() => handleRemovePrize(idx, prize.id)}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-xs font-bold uppercase"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleSave(idx)}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    {prize.isNew ? 'Crear Premio' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {prizes.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
              <Trophy size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
              <p className="text-slate-500 font-bold">No hay premios configurados aún</p>
            </div>
          )}

          <button 
            onClick={handleAddPrize}
            className="w-full py-6 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-3xl transition-all flex flex-col items-center gap-2 group"
          >
            <div className="p-3 rounded-full bg-slate-800 group-hover:bg-indigo-500 transition-colors">
              <Plus className="text-slate-400 group-hover:text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-400">Añadir Nuevo Premio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
