'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Check, Shield, Lock, ChevronDown } from 'lucide-react';

// =============================================
// PALETAS PREDEFINIDAS
// =============================================
const PALETTES = [
    {
        name: 'Verde Energía', emoji: '⚡',
        colors: { brandColorPrimary: '#00E676', brandColorBg: '#0F172A', brandColorSecondary: '#1E293B', brandColorHeading: '#FFFFFF', brandColorText: '#F8FAFC', brandColorBars: '#00E676' }
    },
    {
        name: 'Azul Corporativo', emoji: '🏢',
        colors: { brandColorPrimary: '#3B82F6', brandColorBg: '#0A1628', brandColorSecondary: '#1E3A5F', brandColorHeading: '#FFFFFF', brandColorText: '#E0EDFF', brandColorBars: '#60A5FA' }
    },
    {
        name: 'Rojo Pasión', emoji: '🔥',
        colors: { brandColorPrimary: '#EF4444', brandColorBg: '#120808', brandColorSecondary: '#2D1A1A', brandColorHeading: '#FFF1F1', brandColorText: '#FED7D7', brandColorBars: '#EF4444' }
    },
    {
        name: 'Oro Premium', emoji: '👑',
        colors: { brandColorPrimary: '#FACC15', brandColorBg: '#0E0C04', brandColorSecondary: '#1C1A0A', brandColorHeading: '#FACC15', brandColorText: '#FEF9C3', brandColorBars: '#EAB308' }
    },
    {
        name: 'Morado Innovación', emoji: '🚀',
        colors: { brandColorPrimary: '#A855F7', brandColorBg: '#0D0818', brandColorSecondary: '#1E1030', brandColorHeading: '#E8D5FF', brandColorText: '#DDD6FE', brandColorBars: '#C084FC' }
    },
    {
        name: 'Naranja Dinámico', emoji: '🏆',
        colors: { brandColorPrimary: '#F97316', brandColorBg: '#0E0A02', brandColorSecondary: '#1C1205', brandColorHeading: '#FFFFFF', brandColorText: '#FFEDD5', brandColorBars: '#F97316' }
    },
    {
        name: 'Gris Tecnológico', emoji: '⚙️',
        colors: { brandColorPrimary: '#94A3B8', brandColorBg: '#0F172A', brandColorSecondary: '#1E293B', brandColorHeading: '#E2E8F0', brandColorText: '#CBD5E1', brandColorBars: '#64748B' }
    },
    {
        name: 'Negro Elegante', emoji: '🖤',
        colors: { brandColorPrimary: '#F8FAFC', brandColorBg: '#000000', brandColorSecondary: '#0D0D0D', brandColorHeading: '#F8FAFC', brandColorText: '#D1D5DB', brandColorBars: '#94A3B8' }
    },
];

// =============================================
// TIPOGRAFÍAS POR CATEGORÍA
// =============================================
const FONT_CATEGORIES = [
    {
        id: 'corp',
        category: 'Seria y Corporativa',
        fonts: [
            { name: 'Montserrat', value: 'Montserrat, sans-serif', gfamily: 'Montserrat:wght@700;900' },
            { name: 'Raleway', value: 'Raleway, sans-serif', gfamily: 'Raleway:wght@700;900' },
            { name: 'Nunito Sans', value: '"Nunito Sans", sans-serif', gfamily: 'Nunito+Sans:wght@700;900' },
        ]
    },
    {
        id: 'sport',
        category: 'Deportiva e Impactante',
        fonts: [
            { name: 'Russo One', value: '"Russo One", sans-serif', gfamily: 'Russo+One' },
            { name: 'Bebas Neue', value: '"Bebas Neue", sans-serif', gfamily: 'Bebas+Neue' },
            { name: 'Oswald', value: 'Oswald, sans-serif', gfamily: 'Oswald:wght@600;700' },
        ]
    },
    {
        id: 'tech',
        category: 'Moderna y Tecnológica',
        fonts: [
            { name: 'Space Grotesk', value: '"Space Grotesk", sans-serif', gfamily: 'Space+Grotesk:wght@700' },
            { name: 'Inter', value: 'Inter, sans-serif', gfamily: 'Inter:wght@700;900' },
            { name: 'DM Sans', value: '"DM Sans", sans-serif', gfamily: 'DM+Sans:wght@700;900' },
        ]
    },
    {
        id: 'premium',
        category: 'Elegante y Premium',
        fonts: [
            { name: 'Playfair Display', value: '"Playfair Display", serif', gfamily: 'Playfair+Display:wght@700;900' },
            { name: 'Cormorant', value: 'Cormorant, serif', gfamily: 'Cormorant:wght@600;700' },
            { name: 'Libre Baskerville', value: '"Libre Baskerville", serif', gfamily: 'Libre+Baskerville:wght@700' },
        ]
    },
];

// =============================================
// COLOR FIELDS DEFINITION
// =============================================
const COLOR_FIELDS = [
    { key: 'brandColorPrimary', label: 'Color de botones y textos destacados', emoji: '👆', description: 'El color principal de tu marca — botones, links y acentos.' },
    { key: 'brandColorBg', label: 'Color de fondo de toda tu página', emoji: '🎨', description: 'El fondo principal donde se ve todo el contenido.' },
    { key: 'brandColorSecondary', label: 'Color de las cajitas del ranking y jugadores', emoji: '🃏', description: 'Tarjetas, contenedores y paneles secundarios.' },
    { key: 'brandColorHeading', label: 'Color de los títulos y nombres importantes', emoji: '✏️', description: 'Encabezados, nombres de empresa y títulos de sección.' },
    { key: 'brandColorText', label: 'Color del texto que leen tus empleados', emoji: '📖', description: 'El texto de lectura general en toda la app.' },
    { key: 'brandColorBars', label: 'Color de las barras de Guerra de Áreas', emoji: '⚔️', description: 'Barra del equipo líder en la competencia de departamentos.' },
];

// =============================================
// SUB-COMPONENT: Color Picker Popup
// =============================================
function ColorPickerField({ field, value, onChange }: { field: typeof COLOR_FIELDS[0], value: string, onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const [hexInput, setHexInput] = useState(value);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => { setHexInput(value); }, [value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleHexChange = (v: string) => {
        setHexInput(v);
        if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 p-4 bg-[#0D1525] border border-[#1E293B] rounded-2xl hover:border-slate-600 transition-all group"
            >
                <div
                    className="w-10 h-10 rounded-xl shadow-lg flex-shrink-0 ring-2 ring-black/30 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: value }}
                />
                <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-xs font-black text-white uppercase tracking-wide leading-tight">
                        {field.emoji} {field.label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 font-mono">{value.toUpperCase()}</span>
                </div>
                <span className="text-slate-600 text-xs font-bold uppercase tracking-wide">Editar</span>
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-[#0F1A2E] border border-[#1E293B] rounded-2xl p-5 shadow-2xl shadow-black/60 w-full max-w-[280px] animate-in zoom-in-95 slide-in-from-top-2 duration-150">
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">{field.description}</p>
                    <HexColorPicker color={value} onChange={onChange} style={{ width: '100%', height: '180px' }} />
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 shadow-inner" style={{ backgroundColor: value }} />
                        <input
                            type="text"
                            value={hexInput}
                            onChange={(e) => handleHexChange(e.target.value)}
                            className="flex-1 bg-[#1E293B] border border-[#334155] text-white text-xs font-mono px-3 py-2 rounded-xl focus:outline-none focus:border-slate-400 uppercase tracking-widest"
                            placeholder="#000000"
                            maxLength={7}
                        />
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="mt-3 w-full py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                        style={{ backgroundColor: 'var(--brand-primary, #00E676)', color: 'var(--brand-bg, #0F172A)' }}
                    >
                        ✓ Aplicar Color
                    </button>
                </div>
            )}
        </div>
    );
}

// =============================================
// SUB-COMPONENT: Google Fonts Loader
// =============================================
function GoogleFontsLoader() {
    const families = FONT_CATEGORIES.flatMap(cat => cat.fonts.map(f => f.gfamily)).join('&family=');
    const url = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    return <link rel="stylesheet" href={url} />;
}

// =============================================
// MAIN: BrandingTab
// =============================================
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

export const BrandingTab: React.FC<BrandingTabProps> = ({ config, setConfig }) => {
    const planLevel = getPlanLevel(config.packageType);
    const companyDisplayName = config.companyName || 'TU EMPRESA';
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    const handleColorChange = (key: string, value: string) => {
        setConfig({ ...config, [key]: value });
    };

    const applyPalette = (palette: typeof PALETTES[0]) => {
        setConfig({ ...config, ...palette.colors });
    };

    const handleFontSelect = (fontValue: string) => {
        setConfig({ ...config, brandFontFamily: fontValue });
        setOpenCategory(null); // Colapsar todo al seleccionar
    };

    return (
        <div className="space-y-10">
            {/* Load all fonts */}
            <GoogleFontsLoader />

            {/* ─── SECCIÓN: COLORES ─── */}
            <section>
                <div className="mb-6">
                    <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                        🎨 Colores de tu Marca
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Haz clic en cualquier color para editarlo con la rueda de color interactiva.</p>
                </div>
                <div className="space-y-3">
                    {COLOR_FIELDS.map((field) => (
                        <ColorPickerField
                            key={field.key}
                            field={field}
                            value={config[field.key] || '#00E676'}
                            onChange={(v) => handleColorChange(field.key, v)}
                        />
                    ))}
                </div>
            </section>

            {/* ─── SECCIÓN: PALETAS ─── */}
            <section>
                <div className="mb-5">
                    <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                        ✨ Paletas Prediseñadas
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Aplica un tema completo de un solo clic.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {PALETTES.map((palette) => {
                        const isActive = config.brandColorPrimary === palette.colors.brandColorPrimary
                            && config.brandColorBg === palette.colors.brandColorBg;
                        return (
                            <button
                                key={palette.name}
                                onClick={() => applyPalette(palette)}
                                className={`group p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] relative overflow-hidden ${isActive ? 'border-[#00E676] bg-[#00E676]/5 shadow-lg shadow-[#00E676]/10' : 'border-[#1E293B] bg-[#0D1525] hover:border-slate-600'}`}
                                style={{ borderColor: isActive ? palette.colors.brandColorPrimary : undefined }}
                            >
                                {/* Color dots */}
                                <div className="flex gap-1.5 mb-3">
                                    {[palette.colors.brandColorPrimary, palette.colors.brandColorBg, palette.colors.brandColorSecondary, palette.colors.brandColorBars].map((c, i) => (
                                        <div key={i} className="w-5 h-5 rounded-full shadow-sm ring-1 ring-black/20 flex-shrink-0" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-white block">{palette.emoji} {palette.name}</span>
                                    {isActive && <Check size={14} className="flex-shrink-0" style={{ color: palette.colors.brandColorPrimary }} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ─── SECCIÓN: TIPOGRAFÍA (ACORDEÓN) ─── */}
            <section>
                <div className="mb-5">
                    <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                        ✍️ Tipografía Corporativa
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Elige la fuente que mejor representa a tu empresa.</p>
                </div>

                <div className="space-y-3">
                    {FONT_CATEGORIES.map((cat) => {
                        const isOpen = openCategory === cat.id;
                        const hasSelectedFont = cat.fonts.some(f => f.value === config.brandFontFamily);

                        return (
                            <div key={cat.id} className="border border-[#1E293B] rounded-2xl overflow-hidden bg-[#0D1525] transition-all duration-300">
                                <button
                                    onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                                    className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isOpen ? 'bg-[#1E293B]/50' : 'hover:bg-[#1E293B]/30'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${hasSelectedFont ? 'text-[#00E676]' : 'text-slate-400'}`}>
                                            {cat.category}
                                        </span>
                                        {hasSelectedFont && <div className="w-1.5 h-1.5 rounded-full bg-[#00E676] shadow-[0_0_8px_rgba(0,230,118,0.5)]" />}
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                    <div className="grid grid-cols-1 gap-3 mt-2">
                                        {cat.fonts.map((font) => {
                                            const isSelected = config.brandFontFamily === font.value;
                                            return (
                                                <button
                                                    key={font.name}
                                                    onClick={() => handleFontSelect(font.value)}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.01] relative flex items-center gap-4 ${isSelected
                                                        ? 'border-[#00E676] bg-[#00E676]/5 shadow-md shadow-[#00E676]/5'
                                                        : 'border-[#1E293B] bg-[#0F172A] hover:border-slate-600'}`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <span
                                                            className="block text-xl text-white truncate font-bold leading-tight"
                                                            style={{ fontFamily: font.value }}
                                                        >
                                                            {companyDisplayName}
                                                        </span>
                                                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5 block">{font.name}</span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-6 h-6 bg-[#00E676] rounded-full flex items-center justify-center text-[#0F172A] flex-shrink-0">
                                                            <Check size={13} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ─── SECCIÓN: GUERRA DE ÁREAS TOGGLE ─── */}
            <section className={`p-5 bg-[#0F172A] rounded-2xl border border-[#334155] relative overflow-hidden transition-all ${planLevel < 4 ? 'opacity-50' : ''}`}>
                {planLevel < 4 && (
                    <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center backdrop-blur-[1px] rounded-2xl">
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
                        <p className="text-[10px] text-slate-400">Competencia entre departamentos de tu empresa.</p>
                    </div>
                    <label className={`relative inline-flex items-center shrink-0 ${planLevel < 4 ? 'pointer-events-none' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={!!config.enableDepartmentWar}
                            onChange={(e) => setConfig({ ...config, enableDepartmentWar: e.target.checked })}
                            className="sr-only peer"
                            disabled={planLevel < 4}
                        />
                        <div className="w-12 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                    </label>
                </div>
            </section>
        </div>
    );
};
