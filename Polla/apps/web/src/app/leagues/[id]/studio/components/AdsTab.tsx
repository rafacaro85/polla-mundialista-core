import React from 'react';
import { Megaphone, Trash2, Plus, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { SectionTitle } from './StudioUI';
import { Loader2 } from 'lucide-react';

interface AdsTabProps {
    config: any;
    setConfig: (newConfig: any) => void;
    onUploadAdImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAdImage: (index: number) => void;
    uploadingAd: boolean;
}

export const AdsTab: React.FC<AdsTabProps> = ({ config, setConfig, onUploadAdImage, onRemoveAdImage, uploadingAd }) => {
    return (
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 animate-in fade-in duration-500">
            <div>
                <SectionTitle
                    title="Configuración de Publicidad"
                    subtitle="Activa y gestiona el banner publicitario."
                />

                <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-6 space-y-6">
                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                                <Megaphone className="text-[#00E676]" size={18} />
                                Mostrar Publicidad
                            </h4>
                            <p className="text-slate-400 text-xs mt-1">Habilita el banner rotativo en el inicio.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!config.showAds}
                                onChange={(e) => setConfig({ ...config, showAds: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#00E676]"></div>
                        </label>
                    </div>

                    <div className="h-px bg-slate-800 w-full" />

                    {/* Image Uploader */}
                    <div className={!config.showAds ? 'opacity-50 pointer-events-none' : ''}>
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="text-white font-bold text-xs uppercase">Imágenes del Banner ({config.adImages?.length || 0}/3)</h5>
                            {config.adImages?.length < 3 && (
                                <label className={`flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all ${uploadingAd ? 'opacity-50 cursor-wait' : ''}`}>
                                    {uploadingAd ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Agregar Imagen
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={onUploadAdImage}
                                        disabled={uploadingAd}
                                    />
                                </label>
                            )}
                        </div>

                        {/* Image Grid */}
                        <div className="grid gap-3">
                            {config.adImages && config.adImages.map((url: string, index: number) => (
                                <div key={index} className="relative aspect-[4/1] bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group">
                                    <img src={url} alt={`Ad ${index + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onRemoveAdImage(index)}
                                            className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                                            title="Eliminar imagen"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[10px] text-white font-bold">
                                        #{index + 1}
                                    </div>
                                </div>
                            ))}

                            {(!config.adImages || config.adImages.length === 0) && (
                                <div className="border border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 gap-2">
                                    <ImageIcon size={32} className="opacity-50" />
                                    <span className="text-xs">No hay imágenes cargadas</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Info */}
            <div>
                 <SectionTitle title="Vista Previa" subtitle="Cómo se verá tu banner." />
                 <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                    <p className="text-slate-400 text-sm mb-4">
                        El banner rotará automáticamente entre las imágenes cargadas.
                        Si no hay imágenes, se mostrará el banner por defecto (si la opción está activa).
                    </p>
                    {config.showAds && config.adImages?.length > 0 ? (
                        <div className="w-full aspect-[4/1] bg-slate-800 rounded-lg overflow-hidden relative">
                             <img src={config.adImages[0]} className="w-full h-full object-cover opacity-80" alt="Preview"/>
                             <div className="absolute inset-0 flex items-center justify-center">
                                <span className="px-3 py-1 bg-black/50 text-white text-xs font-bold rounded">Vista Previa (Imagen 1)</span>
                             </div>
                        </div>
                    ) : (
                        <div className="text-yellow-500 text-xs font-bold flex items-center gap-2">
                           <Megaphone size={14} />
                           {config.showAds ? "Sube imágenes para activar el carrusel" : "La publicidad está desactivada"}
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};
