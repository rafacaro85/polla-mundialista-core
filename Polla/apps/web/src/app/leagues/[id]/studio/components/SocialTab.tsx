import React from 'react';
import { SectionTitle } from './StudioUI';
import { Instagram, Facebook, MessageCircle, Youtube, Linkedin, Globe, Lock, Share2 } from 'lucide-react';

interface SocialTabProps {
    config: any;
    setConfig: (newConfig: any) => void;
}

const SocialInput = ({
    label,
    value,
    onChange,
    icon: Icon,
    placeholder,
    prefix
}: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    icon: any,
    placeholder: string,
    prefix?: string
}) => (
    <div className="group">
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
            />
        </div>
    </div>
);

const SocialInputSimple = ({
    label,
    value,
    onChange,
    icon: Icon,
    placeholder
}: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    icon: any,
    placeholder: string
}) => (
    <div className="group">
        <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 group-focus-within:text-[#00E676] transition-colors">
            <Icon size={14} /> {label}
        </label>
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-all"
        />
    </div>
);

export const SocialTab: React.FC<SocialTabProps> = ({ config, setConfig }) => {

    // Check plan level? (Optional based on user request "como el plan es platino tiene acceso...")
    // But logic should probably be just allow editing if they have access to studio.

    const handleChange = (key: string, value: string) => {
        setConfig({ ...config, [key]: value });
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div>
                <SectionTitle title="Redes Principales" subtitle="Conecta tus canales oficiales." />
                <div className="space-y-4">
                    <SocialInputSimple
                        label="Instagram"
                        icon={Instagram}
                        value={config.socialInstagram}
                        onChange={(v) => handleChange('socialInstagram', v)}
                        placeholder="https://instagram.com/miempresa"
                    />
                    <SocialInputSimple
                        label="Facebook"
                        icon={Facebook}
                        value={config.socialFacebook}
                        onChange={(v) => handleChange('socialFacebook', v)}
                        placeholder="https://facebook.com/miempresa"
                    />
                    <SocialInputSimple
                        label="WhatsApp"
                        icon={MessageCircle}
                        value={config.socialWhatsapp}
                        onChange={(v) => handleChange('socialWhatsapp', v)}
                        placeholder="https://wa.me/57300..."
                    />
                    <SocialInputSimple
                        label="YouTube"
                        icon={Youtube}
                        value={config.socialYoutube}
                        onChange={(v) => handleChange('socialYoutube', v)}
                        placeholder="https://youtube.com/@miempresa"
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
                    />
                    <div className="group">
                        <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 group-focus-within:text-[#00E676] transition-colors">
                            <Share2 size={14} /> TikTok
                        </label>
                        <input
                            type="text"
                            value={config.socialTiktok || ''}
                            onChange={(e) => handleChange('socialTiktok', e.target.value)}
                            placeholder="https://tiktok.com/@miempresa"
                            className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-all"
                        />
                    </div>

                    <SocialInputSimple
                        label="Sitio Web"
                        icon={Globe}
                        value={config.socialWebsite}
                        onChange={(v) => handleChange('socialWebsite', v)}
                        placeholder="https://miempresa.com"
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
