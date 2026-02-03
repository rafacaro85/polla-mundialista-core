import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trophy, Users, ClipboardPen, Star, BarChartBig, Lock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';


interface OnboardingMissionsProps {
    hasLeagues: boolean;
    onNavigate: (tab: 'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus') => void;
    currentLeague?: any;
}

export const OnboardingMissions: React.FC<OnboardingMissionsProps> = ({ hasLeagues, onNavigate, currentLeague }) => {

    // Smart Logic: Start with "predictions" (item-3) open if they have a league, otherwise "create" (item-1).
    const defaultValue = hasLeagues ? "item-3" : "item-1";

    const handleInvite = () => {
        const inviteCode = currentLeague.code || currentLeague.accessCodePrefix;
        if (currentLeague && currentLeague.isAdmin && inviteCode) {
             const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
             const message = `¡Únete a mi polla mundialista "${currentLeague.name}"! Predice los resultados y gana. Entra aquí: ${inviteLink}`;
             
             console.log("Attempting to share via WhatsApp:", message);
             
             // Use window.open with fully encoded URL
             const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
             window.open(waUrl, '_blank');
        } else {
            console.warn("Invite failed: Missing admin rights or league code", currentLeague);
            if (!currentLeague?.code && !currentLeague?.accessCodePrefix) toast.error("Error: No hay código de invitación disponible.");
            if (!currentLeague?.isAdmin) onNavigate('leagues');
        }
    };

    return (
        <div className="w-full mb-6">
            <Accordion type="single" collapsible defaultValue={defaultValue} className="w-full flex flex-col gap-3">
                
                {/* MISSION 1: CREA TU ESTADIO */}
                <AccordionItem value="item-1" className="bg-[#1E293B] border border-white/5 rounded-xl overflow-hidden shadow-lg data-[state=open]:border-[#00E676]/30 transition-all duration-300">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5 data-[state=open]:bg-white/5">
                        <div className="flex items-center gap-3 text-left">
                            {hasLeagues ? (
                                <div className="p-1.5 bg-[#00E676]/20 rounded-full text-[#00E676] animate-in zoom-in">
                                    <CheckCircle2 size={18} />
                                </div>
                            ) : (
                                <div className="p-1.5 bg-slate-700/50 rounded-full text-slate-400">
                                    <Trophy size={18} />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className={`font-russo uppercase text-sm ${hasLeagues ? 'text-[#00E676] line-through opacity-70' : 'text-white'}`}>Crea tu Estadio</span>
                                <span className="text-[10px] text-slate-400 font-normal">Arma tu propia polla</span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 text-slate-400 text-xs">
                        <div className="pl-[3rem]">
                            {hasLeagues ? (
                                <div className="flex flex-col gap-2">
                                    <p className="text-[#00E676] italic">¡Misión Cumplida! Ya tienes equipo.</p>
                                    <p>Pero la diversión aumenta con más amigos.</p>
                                    <Button size="sm" variant="outline" className="w-full mt-1 border-[#00E676]/30 text-[#00E676] hover:bg-[#00E676] hover:text-[#0F172A]" onClick={() => onNavigate('leagues')}>
                                        Crear otra Polla
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <p>Para jugar necesitas un terreno. Ve a la pestaña Pollas y crea tu propio torneo o únete al de tus amigos.</p>
                                    <Button size="sm" className="w-full mt-1 bg-[#00E676] text-[#0F172A] hover:bg-white font-bold" onClick={() => onNavigate('leagues')}>
                                        Ir a Pollas
                                    </Button>
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* MISSION 2: CONVOCA A LA HINCHADA */}
                <AccordionItem value="item-2" className="bg-[#1E293B] border border-white/5 rounded-xl overflow-hidden shadow-lg data-[state=open]:border-[#00E676]/30 transition-all duration-300">
                     <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5 data-[state=open]:bg-white/5">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-1.5 bg-slate-700/50 rounded-full text-slate-400">
                                <Users size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-russo uppercase text-sm text-white">Convoca a la Hinchada</span>
                                <span className="text-[10px] text-slate-400 font-normal">Comparte el código</span>
                            </div>
                        </div>
                    </AccordionTrigger>
                     <AccordionContent className="px-4 pb-4 pt-0 text-slate-400 text-xs">
                        <div className="pl-[3rem] flex flex-col gap-2">
                            <p>Jugar solo es aburrido. Comparte el código de tu Polla y reta a tus amigos.</p>
                             <Button size="sm" variant="secondary" className="w-full mt-1" onClick={handleInvite}>
                                {currentLeague && currentLeague.isAdmin ? 'Invitar por WhatsApp' : 'Invitar Amigos'}
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* MISSION 3: LANZA TUS PREDICCIONES */}
                <AccordionItem value="item-3" className="bg-[#1E293B] border border-white/5 rounded-xl overflow-hidden shadow-lg data-[state=open]:border-[#00E676]/30 transition-all duration-300">
                     <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5 data-[state=open]:bg-white/5">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-1.5 bg-slate-700/50 rounded-full text-slate-400">
                                <ClipboardPen size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-russo uppercase text-sm text-white">Lanza tus Predicciones</span>
                                <span className="text-[10px] text-slate-400 font-normal">Llena la quiniela</span>
                            </div>
                        </div>
                    </AccordionTrigger>
                     <AccordionContent className="px-4 pb-4 pt-0 text-slate-400 text-xs">
                        <div className="pl-[3rem] flex flex-col gap-2">
                            <p>¡Demuestra cuánto sabes! Ve a Predicciones, llena los marcadores y arma tu cuadro de finales.</p>
                             <Button size="sm" className="w-full mt-1 bg-[#00E676] text-[#0F172A] hover:bg-white font-bold" onClick={() => onNavigate('predictions')}>
                                Ir a Predicciones <ChevronRight size={14} className="ml-1" />
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                 {/* MISSION 4: PUNTOS EXTRA && RANKING */}
                <AccordionItem value="item-4" className="bg-[#1E293B] border border-white/5 rounded-xl overflow-hidden shadow-lg data-[state=open]:border-[#00E676]/30 transition-all duration-300">
                     <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5 data-[state=open]:bg-white/5">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-1.5 bg-slate-700/50 rounded-full text-slate-400">
                                <Star size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-russo uppercase text-sm text-white">Bonus y Ranking</span>
                                <span className="text-[10px] text-slate-400 font-normal">Suma más puntos</span>
                            </div>
                        </div>
                    </AccordionTrigger>
                     <AccordionContent className="px-4 pb-4 pt-0 text-slate-400 text-xs">
                        <div className="pl-[3rem] flex flex-col gap-2">
                            <p>Los detalles definen al campeón. No olvides los Bonus y revisa tu posición en el Ranking.</p>
                             <div className="grid grid-cols-2 gap-2 mt-1">
                                <Button size="sm" variant="outline" className="w-full border-yellow-500/30 text-yellow-500 hover:text-yellow-400" onClick={() => onNavigate('bonus')}>
                                    Ver Bonus
                                </Button>
                                <Button size="sm" variant="outline" className="w-full border-blue-500/30 text-blue-500 hover:text-blue-400" onClick={() => onNavigate('ranking')}>
                                    Ver Ranking
                                </Button>
                             </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>
    );
};
