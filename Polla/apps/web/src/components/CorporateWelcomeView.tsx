import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface CorporateWelcomeViewProps {
    onEnterGame: () => void;
}

export const CorporateWelcomeView: React.FC<CorporateWelcomeViewProps> = ({ onEnterGame }) => {
    const { user } = useAppStore();
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Tu Empresa';
    const companyLogo = process.env.NEXT_PUBLIC_COMPANY_LOGO;
    const items = [
        "Predice los marcadores",
        "Suma puntos por aciertos",
        "Gana premios exclusivos"
    ];

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-[#00E676]/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-500">
                
                {/* Logo Section */}
                <div className="w-32 h-32 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,230,118,0.1)] mb-4">
                    {companyLogo ? (
                        <img 
                            src={companyLogo} 
                            alt={companyName} 
                            className="w-20 h-20 object-contain"
                        />
                    ) : (
                        <Trophy size={48} className="text-[#00E676]" />
                    )}
                </div>

                {/* Welcome Text */}
                <div className="space-y-2">
                    <h2 className="text-[#00E676] font-bold tracking-widest uppercase text-xs">
                        {companyName.toUpperCase()}
                    </h2>
                    <h1 className="text-4xl md:text-5xl font-black text-white leading-tight font-russo">
                        HOLA, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                            {user?.nickname?.split(' ')[0].toUpperCase() || 'CRACK'}
                        </span>
                    </h1>
                    <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed pt-2">
                        Bienvenido a la Copa Oficial de {companyName}. Demuestra cuánto sabes de fútbol.
                    </p>
                </div>

                {/* Feature List (Optional aesthetic touch) */}
                <div className="space-y-3 w-full px-8">
                     {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></div>
                            {item}
                        </div>
                     ))}
                </div>

                {/* CTA Button */}
                <Button 
                    onClick={onEnterGame}
                    className="w-full bg-[#00E676] hover:bg-[#00E676]/90 text-[#0F172A] font-black text-lg py-7 rounded-xl shadow-[0_0_20px_rgba(0,230,118,0.4)] hover:shadow-[0_0_30px_rgba(0,230,118,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group mt-4 relative overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        ENTRAR AL JUEGO <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute top-0 -left-10 w-20 h-full bg-white/20 skew-x-[-20deg] animate-[shimmer_2s_infinite]"></div>
                </Button>

                <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                    POWERED BY LA POLLA VIRTUAL
                </p>
            </div>
        </div>
    );
};
