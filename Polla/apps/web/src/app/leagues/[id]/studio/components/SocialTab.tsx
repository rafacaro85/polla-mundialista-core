import React from 'react';
import { SectionTitle } from './StudioUI';
import { Instagram, Facebook, MessageCircle, Youtube, Linkedin, Globe, Lock, Share2 } from 'lucide-react';

interface SocialTabProps {
    config: any;
    setConfig: (newConfig: any) => void;
    planLevel: number;
}

const SocialInput = ({
    label,
    value,
    onChange,
    icon: Icon,
    placeholder,
    prefix,
    disabled
}: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    icon: any,
    placeholder: string,
    prefix?: string,
    disabled?: boolean
}) => (
    <div className={`group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 group-focus-within:text-[#00E676] transition-colors">
            <Icon size={14} /> {label}
        </label>
        <div className="relative">
            {prefix && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono hidden md:block select-none pointer-events-none">
                    {prefix}
                </div>
            )}
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-all font-mono ${prefix && 'md:pl-[35%]'}`} // Simple alignment for prefix
                disabled={disabled}
            />
        </div>
    </div>
);

const SocialInputSimple = ({
    label,
    value,
    onChange,
    icon: Icon,
    placeholder,
    disabled
}: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    icon: any,
    placeholder: string,
    disabled?: boolean
}) => (
    <div className={`group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 group-focus-within:text-[#00E676] transition-colors">
            <Icon size={14} /> {label}
        </label>
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-all"
            disabled={disabled}
        />
    </div>
);

export const SocialTab: React.FC<SocialTabProps> = ({ config, setConfig, planLevel }) => {

    const handleChange = (key: string, value: string) => {
        setConfig({ ...config, [key]: value });
    };

    const isLocked = planLevel < 2;

    return (
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 animate-in slide-in-from-bottom-4 fade-in duration-500 relative">
             {isLocked && (
                <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center backdrop-blur-[2px] rounded-3xl">
                    <div className="flex flex-col items-center gap-3 p-6 bg-[#0F172A] border border-[#334155] rounded-2xl shadow-xl">
                        <div className="p-3 bg-slate-800 rounded-full">
                            <Lock size={24} className="text-slate-400" />
                        </div>
                        <div className="text-center">
                            <h4 className="text-white font-bold text-sm uppercase tracking-wide">Función Bloqueada</h4>
                            <p className="text-slate-400 text-xs mt-1">Redes Sociales requiere Plan <strong className="text-white">Plata</strong> o superior</p>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <SectionTitle title="Redes Principales" subtitle="Conecta tus canales oficiales." />
                <div className="space-y-4">
                    <SocialInputSimple
                        label="Instagram"
                        icon={Instagram}
                        value={config.socialInstagram}
                        onChange={(v) => handleChange('socialInstagram', v)}
                        placeholder="https://instagram.com/miempresa"
                        disabled={isLocked}
                    />
                    <SocialInputSimple
                        label="Facebook"
                        icon={Facebook}
                        value={config.socialFacebook}
                        onChange={(v) => handleChange('socialFacebook', v)}
                        placeholder="https://facebook.com/miempresa"
                        disabled={isLocked}
                    />
                    <SocialInputSimple
                        label="WhatsApp"
                        icon={MessageCircle}
                        value={config.socialWhatsapp}
                        onChange={(v) => handleChange('socialWhatsapp', v)}
                        placeholder="https://wa.me/57300..."
                        disabled={isLocked}
                    />
                    <SocialInputSimple
                        label="YouTube"
                        icon={Youtube}
                        value={config.socialYoutube}
                        onChange={(v) => handleChange('socialYoutube', v)}
                        placeholder="https://youtube.com/@miempresa"
                        disabled={isLocked}
                    />
                </div>
            </div>

            <div>
                <SectionTitle title="Otros Canales" subtitle="Amplía tu presencia digital." />
                <div className="space-y-4">
                    <SocialInputSimple
                        label="LinkedIn"
                        icon={Linkedin}
                        value={config.socialLinkedin}
                        onChange={(v) => handleChange('socialLinkedin', v)}
                        placeholder="https://linkedin.com/company/miempresa"
                        disabled={isLocked}
                    />
                    <div className={`group ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 group-focus-within:text-[#00E676] transition-colors">
                            <Share2 size={14} /> TikTok
                        </label>
                        <input
                            type="text"
                            value={config.socialTiktok || ''}
                            onChange={(e) => handleChange('socialTiktok', e.target.value)}
                            placeholder="https://tiktok.com/@miempresa"
                            className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-all"
                            disabled={isLocked}
                        />
                    </div>

                    <SocialInputSimple
                        label="Sitio Web"
                        icon={Globe}
                        value={config.socialWebsite}
                        onChange={(v) => handleChange('socialWebsite', v)}
                        placeholder="https://miempresa.com"
                        disabled={isLocked}
                    />
                </div>

                <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                    <Share2 className="text-yellow-500 shrink-0 mt-1" size={18} />
                    <div>
                        <h4 className="text-yellow-500 font-bold text-xs uppercase tracking-wide mb-1">Visibilidad Premium</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Los enlaces que agregues aparecerán destacados en la pantalla principal de tu polla empresarial.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
