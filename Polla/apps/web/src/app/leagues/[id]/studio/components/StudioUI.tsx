import React from 'react';
import { Palette, Loader2, Upload } from 'lucide-react';

export const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 min-w-[100px] py-3 md:py-4 flex flex-col items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all rounded-xl border-2 ${isActive
            ? 'border-[#00E676] text-[#00E676] bg-[#00E676]/10 shadow-[0_0_15px_rgba(0,230,118,0.1)]'
            : 'border-transparent bg-[#1E293B] text-slate-400 hover:text-white hover:bg-[#334155]'
            }`}
    >
        <Icon size={20} className="md:w-6 md:h-6" />
        <span className="text-center leading-tight">{label}</span>
    </button>
);

export const SectionTitle = ({ title, subtitle }: any) => (
    <div className="mb-6">
        <h3 className="text-lg font-russo text-white mb-1 uppercase italic">{title}</h3>
        <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
    </div>
);

export const ColorPicker = ({ label, value, onChange }: any) => {
    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (val.startsWith('#')) val = val.substring(1);

        // Solo caracteres hex válidos
        if (/^[0-9A-Fa-f]*$/.test(val)) {
            if (val.length <= 6) {
                onChange(`#${val}`);
            }
        }
    };

    return (
        <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-[#1E293B] border border-[#334155] group hover:border-[#00E676]/50 transition-colors">
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                {/* Muestra de color + Input Nativo Oculto */}
                <div className="relative w-12 h-12 rounded-xl shadow-lg border-2 border-white/10 shrink-0 overflow-hidden cursor-pointer group/picker">
                    <div className="absolute inset-0 transition-colors" style={{ backgroundColor: value }} />
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/picker:opacity-100 transition-opacity pointer-events-none">
                        <Palette size={18} className="text-white drop-shadow-md" />
                    </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1 gap-1">
                    <span className="text-sm font-bold text-slate-200 truncate">{label}</span>

                    {/* Input Hexadecimal Unificado */}
                    <div className="flex items-center bg-[#0F172A] rounded-lg border border-[#334155] focus-within:border-[#00E676] px-3 py-1.5 w-full max-w-[140px] transition-colors">
                        <span className="text-xs font-mono text-slate-500 font-bold mr-1 select-none">#</span>
                        <input
                            type="text"
                            value={value.replace('#', '').toUpperCase()}
                            onChange={handleHexChange}
                            className="bg-transparent border-none outline-none text-xs font-mono text-slate-300 w-full uppercase placeholder:text-slate-600 tracking-wider"
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ImageUploader = ({ label, preview, onChange, uploading, placeholderIcon: Icon, aspect = "square" }: any) => (
    <div className="space-y-3">
        <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-wide">{label}</label>
        <label className={`relative block w-full border-2 border-dashed border-[#334155] hover:border-[#00E676] hover:bg-[#00E676]/5 rounded-2xl cursor-pointer transition-all group overflow-hidden ${aspect === 'video' ? 'aspect-video' : 'h-32 md:h-40'}`}>
            <input type="file" className="hidden" accept="image/*" onChange={onChange} disabled={uploading} />
            {uploading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black/50">
                    <Loader2 className="animate-spin text-[#00E676]" size={32} />
                    <span className="text-xs text-[#00E676] font-bold uppercase tracking-widest">Subiendo...</span>
                </div>
            ) : preview ? (
                <div className="w-full h-full relative">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <span className="text-sm text-white font-bold flex items-center gap-2 uppercase tracking-wide bg-black/50 px-4 py-2 rounded-full border border-white/20">
                            <Upload size={16} /> <span className="hidden sm:inline">Cambiar Imagen</span>
                        </span>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3 group-hover:scale-105 transition-transform p-4 text-center">
                    <div className="p-3 md:p-4 bg-[#1E293B] rounded-full group-hover:bg-[#00E676] group-hover:text-[#0F172A] transition-colors">
                        <Icon size={24} className="md:w-8 md:h-8" />
                    </div>
                    <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest group-hover:text-[#00E676] transition-colors">Click para subir</span>
                </div>
            )}
        </label>
    </div>
);

export const InputGroup = ({ label, children }: any) => (
    <div className="space-y-3">
        <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-wide">{label}</label>
        {children}
    </div>
);
