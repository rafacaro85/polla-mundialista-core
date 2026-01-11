import React from 'react';
import {
    Building2, Trophy, Menu, LayoutTemplate,
    Search, Bell, Award, Image as ImageIcon
} from 'lucide-react';

interface MobilePreviewProps {
    config: {
        brandColorPrimary: string;
        brandColorSecondary: string;
        brandColorBg: string;
        brandColorText: string;
        companyName: string;
        welcomeMessage: string;
        brandingLogoUrl: string;
        brandCoverUrl: string;
        brandFontFamily: string;
    };
    participantsMock: any[];
}

export const MobilePreview = ({ config, participantsMock }: MobilePreviewProps) => {
    return (
        <div
            className="w-full h-full flex flex-col font-sans transition-colors duration-300 overflow-hidden"
            style={{ backgroundColor: config.brandColorBg, color: config.brandColorText }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Russo+One&family=Poppins:wght@400;700;900&family=Roboto+Slab:wght@400;700&display=swap');
                .custom-title-font { font-family: ${config.brandFontFamily}; }
            `}</style>

            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between shadow-sm backdrop-blur-md sticky top-0 z-10"
                style={{ backgroundColor: `${config.brandColorBg}F2`, borderColor: `${config.brandColorSecondary}40` }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm">
                        {config.brandingLogoUrl ? (
                            <img src={config.brandingLogoUrl} className="w-full h-full object-contain" alt="Logo" />
                        ) : (
                            <Building2 className="text-slate-800 w-5 h-5" />
                        )}
                    </div>
                    <h1 className="custom-title-font text-sm leading-tight truncate max-w-[150px]">
                        {config.companyName || 'TU EMPRESA'}
                    </h1>
                </div>
                <div className="flex gap-3 text-slate-400">
                    <Search size={18} />
                    <Bell size={18} />
                </div>
            </header>

            <main className="p-4 space-y-5 flex-1 overflow-y-auto hide-scrollbar">
                {/* Banner Premio */}
                <div className="rounded-2xl overflow-hidden shadow-lg border relative group"
                    style={{ backgroundColor: config.brandColorSecondary, borderColor: `${config.brandColorText}10` }}>
                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: `${config.brandColorText}10` }}>
                        <Award size={16} style={{ color: config.brandColorPrimary }} />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Premios Especiales</span>
                    </div>
                    <div className="w-full h-40 bg-slate-800 relative bg-cover bg-center"
                        style={{ backgroundImage: config.brandCoverUrl ? `url(${config.brandCoverUrl})` : 'none' }}>
                        {!config.brandCoverUrl && (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50">
                                <ImageIcon size={32} className="opacity-50" />
                                <span className="text-[10px] uppercase font-bold mt-2">Sin Banner</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-3 left-4 right-4">
                            <p className="text-white text-sm font-medium line-clamp-2">{config.welcomeMessage}</p>
                        </div>
                    </div>
                </div>

                {/* Ranking */}
                <div className="rounded-2xl p-4 shadow-lg border"
                    style={{ backgroundColor: config.brandColorSecondary, borderColor: `${config.brandColorText}10` }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="custom-title-font text-lg flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-400" /> TOP RANKING
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {participantsMock.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                                <div className="custom-title-font text-lg w-6 text-center opacity-50">{user.rank}</div>
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs border border-white/10">
                                    {user.nickname.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{user.nickname}</p>
                                    <p className="text-[10px] opacity-60 uppercase">Colaborador</p>
                                </div>
                                <span className="font-black text-sm" style={{ color: config.brandColorPrimary }}>
                                    {user.points} PTS
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Nav */}
            <div className="h-14 border-t flex items-center justify-around px-2 shrink-0"
                style={{ backgroundColor: config.brandColorBg, borderColor: `${config.brandColorText}10` }}>
                <div className="flex flex-col items-center gap-1 opacity-100" style={{ color: config.brandColorPrimary }}>
                    <LayoutTemplate size={18} />
                    <span className="text-[8px] font-bold">INICIO</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <Trophy size={18} />
                    <span className="text-[8px] font-bold">RANKING</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <Menu size={18} />
                    <span className="text-[8px] font-bold">MENÚ</span>
                </div>
            </div>
        </div>
    );
};
