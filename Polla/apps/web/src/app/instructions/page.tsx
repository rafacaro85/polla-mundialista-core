"use client";

import React, { useState } from 'react';
import { 
    Trophy, Users, Calendar, Star, Shield, HelpCircle, 
    CheckCircle, ArrowRight, Zap, Calculator, Medal, Target 
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// --- DATA & SECTIONS ---

const SECTIONS = [
    { id: 'intro', label: 'Inicio', icon: Trophy },
    { id: 'setup', label: 'Tu Polla', icon: Users },
    { id: 'predictions', label: 'Predicciones', icon: Target },
    { id: 'scoring', label: 'Puntos', icon: Calculator },
    { id: 'bonus', label: 'Bonus', icon: Zap },
    { id: 'ranking', label: 'Ranking', icon: Medal },
];

export default function InstructionsPage() {
    const [activeSection, setActiveSection] = useState('intro');

    return (
        <div className="min-h-screen bg-[#0F172A] pb-24 font-sans text-slate-200">
            {/* HERO HEADER */}
            <div className="relative bg-gradient-to-br from-[#020617] to-[#1e293b] pt-12 pb-16 px-6 text-center border-b border-slate-800">
                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-full mb-6 ring-1 ring-green-500/30">
                        <HelpCircle size={32} className="text-[#00E676]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-sm">
                        CÓMO JUGAR
                        <span className="block text-[#00E676] mt-2">POLLA MUNDIALISTA</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                        Domina las reglas, suma puntos y conviértete en el campeón de tu polla. 
                        Aquí tienes todo lo que necesitas saber.
                    </p>
                </div>
            </div>

            {/* NAVIGATION PILLS */}
            <div className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 py-3 shadow-lg">
                <div className="max-w-5xl mx-auto px-4 overflow-x-auto no-scrollbar">
                    <div className="flex space-x-2 md:justify-center min-w-max">
                        {SECTIONS.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300
                                        ${isActive 
                                            ? 'bg-[#00E676] text-[#020617] shadow-[0_0_15px_rgba(0,230,118,0.4)] scale-105' 
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}
                                    `}
                                >
                                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                    {section.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                
                {activeSection === 'intro' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center md:text-left md:flex gap-8 items-center hover:bg-slate-800/80 transition-colors">
                            <div className="flex-1 space-y-4">
                                <h2 className="text-2xl font-bold text-white">El Objetivo</h2>
                                <p className="text-slate-300">
                                    El objetivo es simple: <strong>acumular la mayor cantidad de puntos</strong> prediciendo los resultados de los partidos del Mundial. Compites contra tus amigos, compañeros de trabajo o familiares en una tabla de posiciones global y privada.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:border-[#00E676] transition-colors">
                                        <span className="text-[#00E676] font-bold block mb-1">1. Predice</span>
                                        <span className="text-xs text-slate-400">Adivina marcadores y ganadores.</span>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:border-[#00E676] transition-colors">
                                        <span className="text-[#00E676] font-bold block mb-1">2. Suma</span>
                                        <span className="text-xs text-slate-400">Gana puntos por precisión.</span>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:border-[#00E676] transition-colors">
                                        <span className="text-[#00E676] font-bold block mb-1">3. Gana</span>
                                        <span className="text-xs text-slate-400">Sube en el ranking y lleva el trofeo.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 md:mt-0 flex justify-center">
                                <Trophy size={120} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:scale-110 transition-transform duration-500" />
                            </div>
                        </div>
                         <div className="text-center pt-4">
                            <a href="/dashboard">
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-xl font-bold text-lg shadow-lg group transition-all hover:shadow-blue-500/30"
                                >
                                    Empezar Tutorial <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </a>
                        </div>
                    </div>
                )}

                {activeSection === 'setup' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                         <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-shadow">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Users className="text-blue-400" /> Crea o Únete
                            </h2>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4 items-start group">
                                    <div className="bg-blue-500/20 p-2 rounded-lg h-fit text-blue-400 font-bold shrink-0 mt-1 group-hover:bg-blue-500 group-hover:text-white transition-colors">1</div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Crea tu propia Polla</h3>
                                        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                                            Ve a la sección <strong>"Mis Pollas"</strong> y selecciona <strong>"Crear Polla"</strong>. 
                                            Obtendrás un <strong>código único</strong> y un <strong>enlace mágico</strong> que puedes compartir por WhatsApp o correo para invitar a tus amigos automáticamente.
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-slate-800"></div>

                                <div className="flex gap-4 items-start group">
                                    <div className="bg-blue-500/20 p-2 rounded-lg h-fit text-blue-400 font-bold shrink-0 mt-1 group-hover:bg-blue-500 group-hover:text-white transition-colors">2</div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Únete a una Polla</h3>
                                        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                                            ¿Te invitaron? Es muy fácil:
                                        </p>
                                        <ul className="mt-3 space-y-2 text-sm text-slate-300">
                                            <li className="flex items-center gap-2 hover:text-white transition-colors">
                                                <span className="text-blue-400">⚡</span> 
                                                <span>Si tienes el <strong>enlace mágico</strong>, solo haz clic y entrarás directo.</span>
                                            </li>
                                            <li className="flex items-center gap-2 hover:text-white transition-colors">
                                                <span className="text-blue-400">🔢</span> 
                                                <span>Si tienes el <strong>código</strong>, ve a "Unirse a una Polla" y escríbelo.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'predictions' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-[#00E676] transition-all hover:-translate-y-1">
                                <div className="text-[#00E676] mb-4">
                                    <Calendar size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Fase de Grupos</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Debes predecir el <strong>marcador exacto</strong> (ej. 2-1) de cada partido.
                                </p>
                                <ul className="text-sm space-y-2 text-slate-300">
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Se puede editar hasta 5 min antes.</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Gana puntos por resultado y marcador.</li>
                                </ul>
                            </div>

                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-yellow-400 transition-all hover:-translate-y-1">
                                <div className="text-yellow-400 mb-4">
                                    <Shield size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Fase Final (KO)</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    ¡Aquí se pone serio! Predice quién avanza en cada llave, desde Octavos hasta la Final.
                                </p>
                                <ul className="text-sm space-y-2 text-slate-300">
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-yellow-500" /> Usa el <strong>Simulador</strong> de llaves.</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-yellow-500" /> Sumas puntos extra por acertar al campeón.</li>
                                </ul>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-900/40 to-slate-900 border border-purple-500/30 p-4 rounded-xl flex gap-4 items-center hover:shadow-lg hover:shadow-purple-500/10 transition-shadow">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <Target className="text-purple-400" size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">IA Suggestions</h4>
                                <p className="text-xs text-slate-400">
                                    ¿No sabes de fútbol? ¡No hay problema! Puedes usar el botón de "Sugerir con IA" para que nuestro algoritmo llene tus predicciones basado en estadísticas históricas.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'scoring' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-slate-700 shadow-lg">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900 text-slate-400">
                                    <tr>
                                        <th className="p-4 font-bold">Resultado</th>
                                        <th className="p-4 font-bold text-center">Puntos Base</th>
                                        <th className="p-4 font-bold hidden md:table-cell">Explicación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700 bg-slate-800">
                                    <tr className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-[#00E676] mb-1">Marcador Exacto</div>
                                            <div className="text-xs text-slate-400">Predicción perfecta.</div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-xl text-white">3</td>
                                        <td className="p-4 text-slate-400 hidden md:table-cell">Aciertas goles de ambos equipos (ej: 2-1).</td>
                                    </tr>
                                    <tr className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-blue-400 mb-1">Ganador o Empate</div>
                                            <div className="text-xs text-slate-400">Aciertas el resultado final.</div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-xl text-white">2</td>
                                        <td className="p-4 text-slate-400 hidden md:table-cell">Gana tu equipo, pero fallaste el marcador.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-900/40 to-slate-900 border border-yellow-500/30 rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-yellow-500/10 transition-shadow">
                            <div className="bg-yellow-500/20 p-3 rounded-full text-yellow-400 animate-pulse">
                                <Star size={24} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Bonus por Goles (+1 pto c/u)</h3>
                                <p className="text-sm text-slate-400">
                                    ¡Cada gol cuenta! Ganas <strong>1 punto extra</strong> si aciertas los goles del equipo local, y otro <strong>1 punto extra</strong> si aciertas los del visitante, incluso si no le pegas al ganador.
                                </p>
                            </div>
                        </div>

                        {/* PUNTOS FASE FINAL (SIMULADOR) */}
                        <div className="mt-8">
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                <Shield className="text-[#00E676]" size={20} /> Puntos Fase Final (Simulador)
                            </h3>
                            <div className="overflow-hidden rounded-2xl border border-slate-700 shadow-lg">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900 text-slate-400">
                                        <tr>
                                            <th className="p-3 font-bold">Fase Acertada</th>
                                            <th className="p-3 font-bold text-center">Puntos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700 bg-slate-800">
                                        <tr className="hover:bg-slate-700/30 transition-colors"><td className="p-3">Dieciseisavos (Round 32)</td><td className="p-3 text-center text-white font-bold">2</td></tr>
                                        <tr className="hover:bg-slate-700/30 transition-colors"><td className="p-3">Octavos de Final</td><td className="p-3 text-center text-white font-bold">3</td></tr>
                                        <tr className="hover:bg-slate-700/30 transition-colors"><td className="p-3">Cuartos de Final</td><td className="p-3 text-center text-white font-bold">6</td></tr>
                                        <tr className="hover:bg-slate-700/30 transition-colors"><td className="p-3">Semifinal</td><td className="p-3 text-center text-white font-bold">10</td></tr>
                                        <tr className="hover:bg-slate-700/30 transition-colors"><td className="p-3">3er Puesto</td><td className="p-3 text-center text-white font-bold">15</td></tr>
                                        <tr className="hover:bg-slate-700/30 transition-colors"><td className="p-3 text-[#00E676] font-bold">GRAN FINAL</td><td className="p-3 text-center text-[#00E676] font-bold text-lg">20</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 italic">
                                * Estos puntos se suman si aciertas qué equipo avanza o gana en esa fase específica.
                            </p>
                        </div>
                    </div>
                )}

                {activeSection === 'bonus' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                         <div className="bg-gradient-to-r from-orange-900/40 to-slate-900 border border-orange-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-700">
                                <Zap size={100} className="text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                                <Star className="text-orange-400 fill-orange-400" /> Preguntas Bonus
                            </h2>
                            <p className="text-slate-300 relative z-10 mb-4">
                                El <strong>administrador de tu polla</strong> puede crear preguntas especiales (ej: ¿Quién será campeón?, ¿Goleador?) que otorgan puntos extra. ¡No olvides responderlas antes de que cierren!
                            </p>
                            <div className="grid gap-3 relative z-10">
                                <div className="bg-slate-900/60 p-3 rounded-lg flex justify-between items-center hover:bg-slate-900/80 transition-colors cursor-default">
                                    <span className="text-sm font-bold text-white">Campeón del Mundo</span>
                                    <span className="text-orange-400 font-bold">+10 pts</span>
                                </div>
                                <div className="bg-slate-900/60 p-3 rounded-lg flex justify-between items-center hover:bg-slate-900/80 transition-colors cursor-default">
                                    <span className="text-sm font-bold text-white">Goleador del Torneo</span>
                                    <span className="text-orange-400 font-bold">+5 pts</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-800 border-l-4 border-[#00E676] hover:bg-slate-800/80 transition-colors">
                            <h3 className="text-lg font-bold text-white mb-2">🃏 Comodines (Power-ups)</h3>
                            <p className="text-sm text-slate-400 mb-4">
                                Tienes ayuda extra, pero es limitada: <strong>solo puedes usar 1 comodín por fase</strong> (Grupos, Octavos, etc). Úsalo sabiamente en el partido que estés más seguro.
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="bg-[#00E676] text-[#020617] px-3 py-1 rounded-full text-xs font-bold w-max shrink-0 shadow-lg shadow-green-500/20">x2 Puntos</div>
                                <span className="text-sm text-slate-300">Duplica los puntos ganados en ese partido.</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'ranking' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center space-y-8">
                        <div>
                            <Medal size={64} className="mx-auto text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
                            <h2 className="text-3xl font-black text-white mb-2">La Gloria te Espera</h2>
                            <p className="text-slate-400 max-w-lg mx-auto">
                                La tabla de posiciones se actualiza en tiempo real después de cada partido.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                            <div className="bg-slate-800 p-6 rounded-2xl flex flex-col items-center border border-slate-700 hover:border-slate-500 transition-all hover:-translate-y-1 hover:shadow-lg">
                                <span className="text-4xl mb-2">🥇</span>
                                <h3 className="font-bold text-white">1er Lugar</h3>
                                <p className="text-xs text-slate-400 mt-1">El Gran Campeón</p>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-2xl flex flex-col items-center border border-slate-700 hover:border-slate-500 transition-all hover:-translate-y-1 hover:shadow-lg">
                                <span className="text-4xl mb-2">🥈</span>
                                <h3 className="font-bold text-white">2do Lugar</h3>
                                <p className="text-xs text-slate-400 mt-1">Subcampeón</p>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-2xl flex flex-col items-center border border-slate-700 hover:border-slate-500 transition-all hover:-translate-y-1 hover:shadow-lg">
                                <span className="text-4xl mb-2">🥉</span>
                                <h3 className="font-bold text-white">3er Lugar</h3>
                                <p className="text-xs text-slate-400 mt-1">Podio</p>
                            </div>
                        </div>

                        <div className="pt-8">
                            <a href="/dashboard">
                                <Button className="bg-[#00E676] hover:bg-[#00c853] text-[#020617] px-8 py-4 rounded-full font-black text-lg shadow-[0_0_20px_rgba(0,230,118,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,230,118,0.6)]">
                                    ¡IR A JUGAR!
                                </Button>
                            </a>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}