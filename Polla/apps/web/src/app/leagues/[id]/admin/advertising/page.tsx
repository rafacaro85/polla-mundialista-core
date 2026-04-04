'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Save, 
  Loader2,
  Megaphone,
  Link as LinkIcon,
  Type,
  Layout,
  Upload,
  Info
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

import { useImageUpload } from '@/hooks/useImageUpload';

export default function AdminAdvertisingPage() {
  const { id: leagueId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const { uploadingState, handleImageUpload } = useImageUpload();

  useEffect(() => {
    fetchData();
  }, [leagueId]);

  const fetchData = async () => {
    try {
      // First check league plan
      const { data: league } = await api.get(`/leagues/${leagueId}`);
      
      const planLevels: Record<string, number> = {
          'familia': 0, 'starter': 0, 'free': 0,
          'parche': 1,
          'amigos': 2, 'bronce': 2, 'enterprise_launch': 2, 'enterprise_bronze': 2, 'business_growth': 2,
          'lider': 3, 'plata': 3, 'enterprise_silver': 3,
          'influencer': 4, 'oro': 4, 'enterprise_gold': 4, 'business_corp': 4,
          'platino': 5, 'diamante': 5, 'enterprise_platinum': 5, 'enterprise_diamond': 5
      };
      const t = (league?.packageType || 'familia').toLowerCase().trim();
      const planLevel = planLevels[t] ?? 0;
      
      if (planLevel < 5) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data } = await api.get(`/leagues/${leagueId}/extra/banners`);
      setBanners(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar la publicidad');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = () => {
    if (banners.length >= 5) {
      toast.error('Máximo 5 banners permitidos');
      return;
    }
    const newBanner = {
      title: 'Título Nuevo\nSubtítulo Aquí',
      description: 'Breve descripción del anuncio',
      tag: 'NOVEDAD',
      imageUrl: '',
      buttonText: 'Ver más',
      buttonUrl: '',
      order: banners.length,
      isNew: true
    };
    setBanners([...banners, newBanner]);
  };

  const handleRemoveBanner = async (index: number, bannerId?: string) => {
    if (bannerId) {
      if (!confirm('¿Estás seguro de eliminar este banner?')) return;
      try {
        await api.delete(`/leagues/${leagueId}/extra/banners/${bannerId}`);
        toast.success('Banner eliminado');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al eliminar');
        return;
      }
    }
    const newBanners = [...banners];
    newBanners.splice(index, 1);
    setBanners(newBanners);
  };

  const handleSave = async (index: number) => {
    setSaving(true);
    const banner = banners[index];
    try {
      if (banner.isNew) {
        const { data } = await api.post(`/leagues/${leagueId}/extra/banners`, banner);
        const updated = [...banners];
        updated[index] = { ...data, isNew: false };
        setBanners(updated);
        toast.success('Banner creado');
      } else {
        await api.put(`/leagues/${leagueId}/extra/banners/${banner.id}`, banner);
        toast.success('Banner actualizado');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el banner');
    } finally {
      setSaving(false);
    }
  };


  const updateBanner = (index: number, field: string, value: any) => {
    const updated = [...banners];
    updated[index] = { ...updated[index], [field]: value };
    setBanners(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
        <Megaphone size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Función Restringida</h2>
        <p className="text-slate-400 text-center mb-6 max-w-sm">Esta función requiere suscribirse al plan Platino o Diamante (Nivel 5).</p>
        <button onClick={() => router.push(`/leagues/${leagueId}/admin`)} className="px-6 py-2 bg-indigo-600 rounded-lg text-white font-bold hover:bg-indigo-500 transition-colors uppercase tracking-widest text-xs">
            Volver al Panel
        </button>
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
            <Megaphone className="text-indigo-400" />
            Cartelera Publicitaria
          </h1>
        </div>

        {/* List */}
        <div className="space-y-6">
          {banners.map((banner, idx) => (
            <div key={banner.id || idx} className="bg-[#1E293B] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
              
              {/* Preview & Image URL */}
              <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-1/3 bg-[#0F172A] p-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-700">
                  {banner.imageUrl ? (
                    <div className="relative group w-full aspect-square md:aspect-auto md:h-full rounded-xl overflow-hidden shadow-2xl">
                      <img src={banner.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Layout className="text-white" size={32} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-square md:h-full flex flex-col items-center justify-center bg-white/5 rounded-xl border-2 border-dashed border-slate-800 gap-2 p-4">
                      <ImageIcon className="text-slate-700" size={40} />
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Sin Imagen</p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2 w-full">
                    <input 
                      type="text"
                      className="flex-1 bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-[10px] focus:border-indigo-500 outline-none truncate"
                      placeholder="URL o sube una imagen..."
                      value={banner.imageUrl}
                      onChange={(e) => updateBanner(idx, 'imageUrl', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => {
                          handleImageUpload(
                            `banner_${idx}`,
                            e,
                            (url) => updateBanner(idx, 'imageUrl', url),
                            'polla-virtual/banners'
                          );
                        };
                        input.click();
                      }}
                      disabled={!!uploadingState[`banner_${idx}`]}
                      className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 rounded-lg hover:bg-indigo-600/30 transition-all flex items-center justify-center"
                      title="Subir Imagen"
                    >
                      {uploadingState[`banner_${idx}`] ? (
                         <Loader2 className="animate-spin" size={14} />
                      ) : (
                         <Upload size={14} />
                      )}
                    </button>
                  </div>

                  {/* Dimension Guide */}
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-2">
                    <Info size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-400 leading-relaxed">
                      <p className="font-bold text-yellow-500/80 mb-1 font-black uppercase tracking-widest">📐 Dimensiones recomendadas:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Horizontal (banner): 1200 x 400 px</li>
                        <li>Relación de aspecto: 3:1</li>
                        <li>Formato: JPG o WebP</li>
                        <li>Peso máximo: 2MB</li>
                      </ul>
                      <p className="mt-1 italic">Para mejores resultados usa imágenes apaisadas (más anchas que altas).</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Etiqueta (Tag)</label>
                      <input 
                        type="text"
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-2 text-xs focus:border-indigo-500 outline-none"
                        value={banner.tag}
                        onChange={(e) => updateBanner(idx, 'tag', e.target.value)}
                        placeholder="Ej: NOVEDAD"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Título Cartelera</label>
                      <textarea 
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-2 text-xs focus:border-indigo-500 outline-none h-16 resize-none"
                        value={banner.title}
                        onChange={(e) => updateBanner(idx, 'title', e.target.value)}
                        placeholder="Línea 1\nLínea 2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Descripción breve</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-2 text-xs focus:border-indigo-500 outline-none"
                      value={banner.description}
                      onChange={(e) => updateBanner(idx, 'description', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1 mb-1">
                        <Type size={10} /> Texto Botón
                      </label>
                      <input 
                        type="text"
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-2 text-xs focus:border-indigo-500 outline-none"
                        value={banner.buttonText}
                        onChange={(e) => updateBanner(idx, 'buttonText', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1 mb-1">
                        <LinkIcon size={10} /> URL Acción
                      </label>
                      <input 
                        type="text"
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-2 text-xs focus:border-indigo-500 outline-none"
                        value={banner.buttonUrl}
                        onChange={(e) => updateBanner(idx, 'buttonUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-black/20 p-4 border-t border-slate-700 flex justify-between items-center">
                <button 
                  onClick={() => handleRemoveBanner(idx, banner.id)}
                  className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={14} /> Eliminar anuncio
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase">BANNER #{idx + 1}</span>
                  <button 
                    onClick={() => handleSave(idx)}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    {banner.isNew ? 'Publicar Banner' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {banners.length === 0 && (
            <div className="text-center py-20 bg-white/5 border-2 border-dashed border-slate-800 rounded-3xl">
              <Megaphone size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
              <p className="text-slate-500 font-bold max-w-xs mx-auto text-sm italic">
                La cartelera está vacía. Añade banners para comunicar novedades a tus participantes.
              </p>
            </div>
          )}

          {banners.length < 5 && (
            <button 
              onClick={handleAddBanner}
              className="w-full py-6 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-white/5 rounded-3xl transition-all flex flex-col items-center gap-2 group"
            >
              <div className="p-3 rounded-full bg-slate-800 group-hover:bg-indigo-500 transition-colors">
                <Plus className="text-slate-400 group-hover:text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-400">Añadir Banner al Slider</span>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Disponibles: {5 - banners.length} de 5</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
