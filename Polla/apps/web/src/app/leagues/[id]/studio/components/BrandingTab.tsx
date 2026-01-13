import React from 'react';
import { Check, Shield, Lock } from 'lucide-react';
import { SectionTitle, ColorPicker } from './StudioUI';

interface BrandingTabProps {
    config: any;
    setConfig: (newConfig: any) => void;
    fontOptions: { name: string; value: string }[];
}

const getPlanLevel = (type?: string) => {
    if (!type) return 1;
    const t = type.toUpperCase();
    if (t.includes('DIAMOND') || t.includes('DIAMANTE')) return 5;
    if (t.includes('PLATINUM') || t.includes('PLATINO')) return 4;
    if (t.includes('BUSINESS_CORP')) return 4;
    if (t.includes('GOLD') || t.includes('ORO')) return 3;
    if (t.includes('SILVER') || t.includes('PLATA')) return 2;
    if (t.includes('BUSINESS_GROWTH')) return 2;
    return 1;
};

export const BrandingTab: React.FC<BrandingTabProps> = ({ config, setConfig, fontOptions }) => {
    const planLevel = getPlanLevel(config.packageType);

    return (
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
                <SectionTitle title="Colores" subtitle="Define la paleta de colores." />
                <div className="space-y-4">
                    <ColorPicker label="Color Primario" value={config.brandColorPrimary} onChange={(v: string) => setConfig({ ...config, brandColorPrimary: v })} />
                    <ColorPicker label="Fondo Oscuro" value={config.brandColorBg} onChange={(v: string) => setConfig({ ...config, brandColorBg: v })} />
                    <ColorPicker label="Tarjetas" value={config.brandColorSecondary} onChange={(v: string) => setConfig({ ...config, brandColorSecondary: v })} />
                    <ColorPicker label="Textos" value={config.brandColorText} onChange={(v: string) => setConfig({ ...config, brandColorText: v })} />
                </div>
            </div>
            <div>
                <SectionTitle title="Tipografía" subtitle="Selecciona la fuente para títulos." />
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {fontOptions.map((font) => (
                        <button
                            key={font.name}
                            onClick={() => setConfig({ ...config, brandFontFamily: font.value })}
                            className={`p-4 md:p-6 rounded-2xl border-2 text-left transition-all relative hover:scale-[1.02] ${config.brandFontFamily === font.value
                                ? 'border-[#00E676] bg-[#00E676]/5 text-white shadow-lg'
                                : 'border-[#334155] bg-[#0F172A] text-slate-400 hover:border-slate-500'}`}
                        >
                            <span className="block text-2xl md:text-3xl mb-2" style={{ fontFamily: font.value }}>Ag</span>
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide block truncate">{font.name}</span>
                            {config.brandFontFamily === font.value && <div className="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 bg-[#00E676] rounded-full flex items-center justify-center text-[#0F172A]"><Check size={12} strokeWidth={3} /></div>}
                        </button>
                    ))}
                </div>

                {/* WAR TOGGLE - GATED */}
                <div className={`mt-8 p-4 md:p-6 bg-[#0F172A] rounded-2xl border border-[#334155] relative overflow-hidden transition-all ${planLevel < 4 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                    {planLevel < 4 && (
                        <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="flex items-center gap-2 px-3 py-1 bg-black/80 rounded-full border border-yellow-500/30 text-yellow-500">
                                <Lock size={12} /> <span className="text-[10px] font-bold uppercase tracking-wider">Plan Platino Requerido</span>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide mb-1">
                                <Shield size={16} className="text-[#00E676]" /> Guerra de Áreas
                            </h4>
                            <p className="text-[10px] md:text-xs text-slate-400">Competencia de departamentos.</p>
                        </div>
                        <label className={`relative inline-flex items-center shrink-0 ${planLevel < 4 ? 'pointer-events-none' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={!!config.enableDepartmentWar}
                                onChange={(e) => setConfig({ ...config, enableDepartmentWar: e.target.checked })}
                                className="sr-only peer"
                                disabled={planLevel < 4}
                            />
                            <div className="w-12 h-6 md:w-14 md:h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 md:after:h-6 md:after:w-6 after:transition-all peer-checked:bg-[#00E676]"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};
