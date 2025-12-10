'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Download, Users, Activity, Ghost, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LeagueAnalyticsPanel({ leagueId }: { leagueId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/leagues/${leagueId}/analytics`)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [leagueId]);

    const handleExport = async () => {
        try {
            const response = await api.get(`/leagues/${leagueId}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `nomina-${leagueId}.csv`);
            document.body.appendChild(link);
            link.click();
            if (link.parentNode) link.parentNode.removeChild(link);
        } catch (e) {
            console.error('Error downloading report', e);
            alert('Error descargando reporte');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando analítica...</div>;
    if (!data) return <div className="p-8 text-center text-slate-500">No hay datos disponibles</div>;

    const maxAvg = Math.max(...(data.departmentRanking || []).map((d: any) => parseFloat(d.avgPoints)), 1);

    return (
        <div className="space-y-8 p-6 bg-slate-900/50 rounded-xl border border-slate-800 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex gap-2 items-center">
                        <Activity className="text-blue-400" /> Analítica Corporativa
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Métricas de engagement y desempeño por áreas</p>
                </div>
                <Button onClick={handleExport} className="bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] font-bold">
                    <Download className="mr-2 h-4 w-4" /> Exportar Nómina (CSV)
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={<Users />} title="Total Miembros" value={data.totalParticipants} color="text-blue-400" />
                <KpiCard icon={<Zap />} title="Activos" value={data.activeParticipants} color="text-yellow-400" />
                <KpiCard icon={<Ghost />} title="Zombies" value={data.zombieParticipants} color="text-slate-500" />
                <KpiCard icon={<Activity />} title="Promedio Puntos" value={data.averagePoints} color="text-purple-400" />
            </div>

            {/* Department Battle */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    ⚔️ Guerra de Áreas (Promedio Puntos)
                </h3>
                <div className="space-y-6">
                    {(data.departmentRanking || []).map((dept: any) => (
                        <div key={dept.department} className="relative group">
                            <div className="flex justify-between text-sm mb-2 items-end">
                                <span className="font-bold text-slate-200 text-base">{dept.department}</span>
                                <div className="text-right">
                                    <span className="text-[#00E676] font-bold text-lg">{dept.avgPoints} pts</span>
                                    <span className="text-slate-500 text-xs ml-2">({dept.members} miembros)</span>
                                </div>
                            </div>
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-[#00E676] rounded-full transition-all duration-1000 relative"
                                    style={{ width: `${(parseFloat(dept.avgPoints) / maxAvg) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(data.departmentRanking || []).length === 0 && (
                        <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                            <Ghost className="mx-auto text-slate-600 mb-2" size={32} />
                            <p className="text-slate-500 text-sm">Aún no hay suficientes datos para comparar áreas.</p>
                            <p className="text-slate-600 text-xs mt-1">Asegúrate de que los usuarios seleccionen su departamento al unirse.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function KpiCard({ icon, title, value, color }: any) {
    return (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center shadow-lg hover:border-slate-700 transition-colors cursor-default">
            <div className={`mb-3 ${color} p-3 bg-slate-900 rounded-full shadow-inner`}>{React.cloneElement(icon, { size: 24 })}</div>
            <div className="text-3xl font-black text-white font-russo">{value}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">{title}</div>
        </div>
    );
}
