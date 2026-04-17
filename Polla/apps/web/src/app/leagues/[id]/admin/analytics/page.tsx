'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, TrendingUp, Users, Target, Trophy, Clock, Download, RefreshCw, 
    Star, ArrowUpRight, Zap, Award, BookOpen, Crown, Goal, Activity, BarChart3, Presentation
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import api from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export default function LeagueAdminAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const leagueId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);

    const fetchData = async (forceRefresh = false) => {
        if (forceRefresh) setRefreshing(true);
        try {
            const res = await api.get(`/analytics/${leagueId}/full-report?refresh=${forceRefresh}`);
            setData(res.data);
            if (forceRefresh) toast.success('Datos actualizados en tiempo real');
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Error al cargar analítica');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [leagueId]);

    const handleExportPDF = () => {
        if (!data) return;
        toast.info('Generando PDF...');
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            
            // Portada
            doc.setFontSize(24);
            doc.setTextColor(16, 185, 129); // Emerald-500
            doc.text('Polla Empresarial', pageWidth / 2, 80, { align: 'center' });
            doc.setFontSize(16);
            doc.setTextColor(100, 100, 100);
            doc.text('Reporte de Analítica y Engagement', pageWidth / 2, 95, { align: 'center' });
            
            const today = new Date().toLocaleDateString('es-CO');
            doc.setFontSize(12);
            doc.text(`Generado el: ${today}`, pageWidth / 2, 110, { align: 'center' });
            
            doc.setFontSize(10);
            doc.text('Generado por La Polla Virtual | lapollavirtual.com', pageWidth / 2, 280, { align: 'center' });

            // Página 2: Ranking Final
            doc.addPage();
            doc.setFontSize(16);
            doc.setTextColor(30, 41, 59);
            doc.text('1. Ranking Final (Top 10)', 14, 20);

            const rankingBody = (data.finalRanking || []).map((r: any) => [
                r.position, r.name, r.total, r.regular, r.joker, r.bonus
            ]);

            autoTable(doc, {
                startY: 30,
                head: [['Pos', 'Nombre', 'Puntos Totales', 'Regular', 'Comodín', 'Bonus']],
                body: rankingBody,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] }
            });

            // Página 3: Participación por Área
            doc.addPage();
            doc.text('2. Participación por Área', 14, 20);
            const deptBody = (data.departmentParticipation || []).map((d: any) => [
                d.department, `${d.percentage}%`
            ]);
            autoTable(doc, {
                startY: 30,
                head: [['Área / Departamento', 'Participación']],
                body: deptBody,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42] }
            });

            // Página 4: Jugadores Destacados
            doc.addPage();
            doc.text('3. Jugadores Destacados', 14, 20);
            const badgesBody = (data.topPlayers || []).map((tp: any) => [
                tp.badge, tp.name, tp.detail
            ]);
            autoTable(doc, {
                startY: 30,
                head: [['Reconocimiento', 'Jugador', 'Métrica']],
                body: badgesBody,
                theme: 'plain'
            });

            // Guardar
            doc.save(`Analitica_Liga_${leagueId}.pdf`);
            toast.success('PDF descargado exitosamente');
        } catch (err) {
            console.error('Error generando PDF:', err);
            toast.error('Hubo un error al generar el documento');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white bg-slate-900 flex items-center justify-center">
                <RefreshCw className="animate-spin text-emerald-500 w-10 h-10" />
            </div>
        );
    }

    if (!data) return null;

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--brand-bg, #0F172A)' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 p-6 border-b backdrop-blur-md bg-opacity-90" style={{ backgroundColor: 'var(--brand-secondary, rgba(30,41,59,0.95))', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push(`/leagues/${leagueId}/admin`)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                                <TrendingUp className="text-[var(--brand-primary,#10B981)]" /> Reporte de Analítica
                            </h1>
                            <p className="text-slate-400 text-sm">Estadísticas avanzadas para entorno corporativo</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2 text-sm font-bold border border-slate-700 transition"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin text-emerald-500' : ''} />
                            Actualizar Datos
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-500/20 transition"
                        >
                            <Download size={16} />
                            Exportar PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
                
                {/* REPORTE 1: Resumen Ejecutivo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
                        <Users className="text-emerald-500 mb-2" size={24} />
                        <p className="text-slate-400 text-xs font-bold uppercase">Participantes</p>
                        <p className="text-3xl font-black text-white">{data.executiveSummary?.totalParticipants || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
                        <Target className="text-blue-500 mb-2" size={24} />
                        <p className="text-slate-400 text-xs font-bold uppercase">Predicciones Totales</p>
                        <p className="text-3xl font-black text-white">{data.executiveSummary?.totalPredictions || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
                        <Trophy className="text-yellow-500 mb-2" size={24} />
                        <p className="text-slate-400 text-xs font-bold uppercase">Líder Actual</p>
                        <p className="text-xl font-black text-white truncate">{data.executiveSummary?.winner?.name || '---'}</p>
                        <p className="text-emerald-400 text-sm font-bold">{data.executiveSummary?.winner?.points || 0} pts</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
                        <Zap className="text-purple-500 mb-2" size={24} />
                        <p className="text-slate-400 text-xs font-bold uppercase">Partido Más Votado</p>
                        <p className="text-sm font-black text-white mt-1 leading-tight">{data.executiveSummary?.topMatch?.homeTeam} vs {data.executiveSummary?.topMatch?.awayTeam}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* REPORTE 4: Actividad por Jornada */}
                    <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Activity className="text-emerald-500" /> Actividad por Jornada</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.activityByMatchday || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '10px' }} itemStyle={{ color: '#10B981', fontWeight: 'bold' }} />
                                    <Line type="monotone" dataKey="predictions" stroke="#10B981" strokeWidth={3} dot={{ fill: '#0F172A', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#10B981' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* REPORTE 3: Participación por Área */}
                    <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6 flex flex-col">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="text-blue-500" /> Participación por Área</h3>
                        {data.departmentParticipation && data.departmentParticipation.length > 0 ? (
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.departmentParticipation} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                        <XAxis type="number" stroke="#94A3B8" fontSize={10} />
                                        <YAxis dataKey="department" type="category" stroke="#94A3B8" fontSize={10} width={80} />
                                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '10px' }} />
                                        <Bar dataKey="percentage" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                                            {data.departmentParticipation.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic">Sin datos suficientes</div>
                        )}
                    </div>
                </div>

                {/* REPORTE 9: Jugadores Destacados */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Award className="text-yellow-500" /> Jugadores Destacados</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(data.topPlayers || []).map((tp: any, i: number) => (
                            <div key={i} className={`${tp.bg} border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center`}>
                                <p className={`text-xl mb-1 ${tp.color}`}>{tp.badge}</p>
                                <p className="text-white font-bold">{tp.name}</p>
                                <p className="text-slate-400 text-xs mt-1">{tp.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* REPORTE 2: Ranking Final */}
                    <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Crown className="text-amber-500" /> Top 10 Ranking Final</h3>
                        <div className="space-y-2">
                            {(data.finalRanking || []).map((r: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                                            i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {r.position}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{r.name}</p>
                                            <p className="text-[10px] text-emerald-400 flex items-center gap-1">Reg: {r.regular} | Comodín: {r.joker}</p>
                                        </div>
                                    </div>
                                    <div className="font-black text-lg text-emerald-500">{r.total}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* REPORTE 8: Evolución Individual */}
                    <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="text-indigo-500" /> Evolución Individual (Top 3)</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.individualEvolution || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                                    <YAxis stroke="#94A3B8" fontSize={10} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '10px' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="Juan Pérez" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="Ana Gómez" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="Carlos Ruíz" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* REPORTE 5: Análisis de Predicciones */}
                    <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Goal className="text-rose-500" /> Análisis de Aciertos</h3>
                        <div className="h-48 w-full flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={[
                                        { name: 'Pleno', value: data.predictionsAnalysis?.accuracy?.exact || 0 },
                                        { name: 'Parcial', value: data.predictionsAnalysis?.accuracy?.partial || 0 },
                                        { name: 'Falló', value: data.predictionsAnalysis?.accuracy?.wrong || 0 }
                                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                        <Cell fill="#10B981" />
                                        <Cell fill="#3B82F6" />
                                        <Cell fill="#EF4444" />
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '10px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* REPORTE 10: Engagement y ROI */}
                    <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Presentation className="text-cyan-500" /> Engagement y Adopción</h3>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-slate-900 rounded-xl p-4 text-center">
                                <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                                <p className="text-xl font-bold text-white">{data.engagementROI?.totalHours || 0} hrs</p>
                                <p className="text-[10px] text-slate-500 uppercase">Tiempo Plataforma</p>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-4 text-center">
                                <TrendingUp className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                                <p className="text-xl font-bold text-white">{data.engagementROI?.avgSessionsPerUser || 0}</p>
                                <p className="text-[10px] text-slate-500 uppercase">Sesiones / Usuario</p>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-4 text-center">
                                <Star className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                                <p className="text-xl font-bold text-white">{data.engagementROI?.activeDays || 0}</p>
                                <p className="text-[10px] text-slate-500 uppercase">Días Activos</p>
                            </div>
                        </div>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.engagementROI?.activityData || []}>
                                    <Bar dataKey="sessions" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                                    <RechartsTooltip cursor={{fill: '#1E293B'}} contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '10px' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
