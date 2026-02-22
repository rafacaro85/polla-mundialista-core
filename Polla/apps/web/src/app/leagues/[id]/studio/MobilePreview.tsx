import React from 'react';
import {
    Building2, Trophy, Menu, LayoutTemplate,
    Search, Bell, Award, Image as ImageIcon, Swords
} from 'lucide-react';

interface MobilePreviewProps {
    config: {
        brandColorPrimary: string;
        brandColorSecondary: string;
        brandColorBg: string;
        brandColorText: string;
        brandColorHeading: string;
        brandColorBars: string;
        companyName: string;
        welcomeMessage: string;
        brandingLogoUrl: string;
        brandCoverUrl: string;
        brandFontFamily: string;
    };
    participantsMock: any[];
}

// Build the Google Fonts URL from the current font family
function getFontUrl(fontFamily: string): string {
    const name = fontFamily.replace(/["']/g, '').split(',')[0].trim().replace(/ /g, '+');
    return `https://fonts.googleapis.com/css2?family=${name}:wght@400;700;900&display=swap`;
}

export const MobilePreview = ({ config, participantsMock }: MobilePreviewProps) => {
    const deptMock = [
        { name: 'Ventas', pct: 100 },
        { name: 'Marketing', pct: 72 },
        { name: 'Tecnología', pct: 55 },
    ];

    return (
        <div
            className="w-full h-full flex flex-col font-sans transition-colors duration-300 overflow-hidden"
            style={{ backgroundColor: config.brandColorBg, color: config.brandColorText }}
        >
            <style>{`
                @import url('${getFontUrl(config.brandFontFamily)}');
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Russo+One&family=Poppins:wght@400;700;900&family=Roboto+Slab:wght@400;700&display=swap');
                .custom-title-font { font-family: ${config.brandFontFamily}; }
            `}</style>

            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10"
                style={{ backgroundColor: `${config.brandColorBg}F2`, borderBottom: `1px solid ${config.brandColorSecondary}60` }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm">
                        {config.brandingLogoUrl ? (
                            <img src={config.brandingLogoUrl} className="w-full h-full object-contain" alt="Logo" />
                        ) : (
                            <Building2 className="text-slate-800 w-5 h-5" />
                        )}
                    </div>
                    <h1 className="custom-title-font text-sm leading-tight truncate max-w-[130px]"
                        style={{ color: config.brandColorHeading }}>
                        {config.companyName || 'TU EMPRESA'}
                    </h1>
                </div>
                <div className="flex gap-3 text-slate-400">
                    <Search size={18} />
                    <Bell size={18} />
                </div>
            </header>

            <main className="p-3 space-y-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {/* Banner Premio */}
                <div className="rounded-2xl overflow-hidden shadow-lg border"
                    style={{ backgroundColor: config.brandColorSecondary, borderColor: `${config.brandColorText}10` }}>
                    <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: `${config.brandColorText}10` }}>
                        <Award size={14} style={{ color: config.brandColorPrimary }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Premio</span>
                    </div>
                    <div className="w-full h-28 bg-slate-800 relative bg-cover bg-center"
                        style={{ backgroundImage: config.brandCoverUrl ? `url(${config.brandCoverUrl})` : 'none' }}>
                        {!config.brandCoverUrl && (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50">
                                <ImageIcon size={24} className="opacity-50" />
                                <span className="text-[9px] uppercase font-bold mt-1">Banner del Premio</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        {config.welcomeMessage && (
                            <div className="absolute bottom-2 left-3 right-3">
                                <p className="text-white text-[10px] font-medium line-clamp-2">{config.welcomeMessage}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ranking */}
                <div className="rounded-2xl p-3 shadow-lg border"
                    style={{ backgroundColor: config.brandColorSecondary, borderColor: `${config.brandColorText}10` }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Trophy size={14} className="text-yellow-400" />
                        <h2 className="custom-title-font text-xs font-black uppercase" style={{ color: config.brandColorHeading }}>TOP Ranking</h2>
                    </div>
                    <div className="space-y-2">
                        {participantsMock.map((user) => (
                            <div key={user.id} className="flex items-center gap-2 px-1">
                                <div className="custom-title-font text-xs w-4 text-center opacity-50 font-bold">{user.rank}</div>
                                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[9px] border border-white/10">
                                    {user.nickname.charAt(0)}
                                </div>
                                <span className="flex-1 text-[10px] font-bold truncate" style={{ color: config.brandColorText }}>{user.nickname}</span>
                                <span className="font-black text-[10px]" style={{ color: config.brandColorPrimary }}>{user.points} PTS</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Guerra de Áreas */}
                <div className="rounded-2xl p-3 shadow-lg border"
                    style={{ backgroundColor: config.brandColorSecondary, borderColor: `${config.brandColorText}10` }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Swords size={14} className="text-red-400" />
                        <h2 className="custom-title-font text-xs font-black uppercase" style={{ color: config.brandColorHeading }}>Guerra de Áreas</h2>
                    </div>
                    <div className="space-y-2.5">
                        {deptMock.map((dept, index) => (
                            <div key={dept.name}>
                                <div className="flex justify-between text-[9px] mb-1 font-bold">
                                    <span style={{ color: config.brandColorText }}>{dept.name}</span>
                                    <span style={{ color: index === 0 ? config.brandColorBars : config.brandColorText }}>{dept.pct}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${dept.pct}%`,
                                            backgroundColor: index === 0 ? config.brandColorBars : `${config.brandColorBars}50`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Nav Bar */}
            <div className="h-12 border-t flex items-center justify-around px-2 shrink-0"
                style={{ backgroundColor: config.brandColorBg, borderColor: `${config.brandColorText}10` }}>
                <div className="flex flex-col items-center gap-0.5 opacity-100" style={{ color: config.brandColorPrimary }}>
                    <LayoutTemplate size={16} />
                    <span className="text-[7px] font-bold">INICIO</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 opacity-40">
                    <Trophy size={16} />
                    <span className="text-[7px] font-bold">RANKING</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 opacity-40">
                    <Menu size={16} />
                    <span className="text-[7px] font-bold">MENÚ</span>
                </div>
            </div>
        </div>
    );
};
