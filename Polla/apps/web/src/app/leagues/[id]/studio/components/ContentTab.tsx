import React from 'react';
import { SectionTitle, InputGroup } from './StudioUI';

interface ContentTabProps {
    config: any;
    setConfig: (newConfig: any) => void;
}

export const ContentTab: React.FC<ContentTabProps> = ({ config, setConfig }) => {
    return (
        <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
            <SectionTitle title="Información General" subtitle="Detalles visibles para todos." />

            <InputGroup label="Nombre Organización">
                <input
                    type="text"
                    value={config.companyName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, companyName: e.target.value })}
                    className="w-full bg-[#0F172A] border-2 border-[#334155] rounded-xl p-3 md:p-4 text-white text-base md:text-lg focus:border-[#00E676] outline-none transition-colors placeholder:text-slate-600 font-medium"
                    placeholder="Ej: Copa Tech 2026"
                />
            </InputGroup>

            <InputGroup label="Mensaje Bienvenida">
                <textarea
                    rows={6}
                    value={config.welcomeMessage}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({ ...config, welcomeMessage: e.target.value })}
                    className="w-full bg-[#0F172A] border-2 border-[#334155] rounded-xl p-3 md:p-4 text-white focus:border-[#00E676] outline-none transition-colors resize-none text-sm leading-relaxed placeholder:text-slate-600"
                    placeholder="Describe los premios..."
                />
            </InputGroup>
        </div>
    );
};
