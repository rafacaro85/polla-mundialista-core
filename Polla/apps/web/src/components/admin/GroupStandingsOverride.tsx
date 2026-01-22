'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AlertCircle, Save, RotateCcw } from 'lucide-react';

export function GroupStandingsOverride() {
    const [group, setGroup] = useState('A');
    const [standings, setStandings] = useState<any[]>([]);
    const [overrides, setOverrides] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStandings();
    }, [group]);

    const loadStandings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/standings/group/${group}`);
            setStandings(data);
            
            // Initialize overrides based on API response behavior
            // Since API returns sorted list, we can infer manual positions if we want, 
            // but for editing, we want to know what the current "manual" value is.
            // But the API calculate endpoint returns the applied result.
            // If we want to show the current "stored" overrides, we might need a separate endpoint 
            // OR we assume the current order is the truth.
            // For simplicity: We initialize the input with the current position.
            const initialOverrides: Record<string, number> = {};
            data.forEach((s: any) => initialOverrides[s.team] = s.position);
            setOverrides(initialOverrides);
        } catch (e) {
            toast.error('Error cargando tabla de posiciones');
        } finally {
            setLoading(false);
        }
    };

    const handleRankChange = (team: string, rank: string) => {
        const val = parseInt(rank);
        if (!isNaN(val)) {
            setOverrides(prev => ({
                ...prev,
                [team]: val
            }));
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const payload = Object.entries(overrides).map(([team, position]) => ({
                team,
                position
            }));
            await api.post('/standings/override', {
                group,
                overrides: payload
            });
            toast.success('Tabla de posiciones actualizada manualmente');
            await loadStandings(); // Reload to confirm
        } catch (e) {
            toast.error('Error guardando cambios');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-[#1E293B] border-slate-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl text-white">Override Manual: Tabla de Posiciones</CardTitle>
                    <CardDescription className="text-slate-400">
                        Ajusta manualmente el orden de los equipos para resolver empates complejos.
                    </CardDescription>
                </div>
                <Select value={group} onValueChange={setGroup}>
                    <SelectTrigger className="w-[120px] bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Grupo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 text-white">
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(g => (
                            <SelectItem key={g} value={g} className="focus:bg-slate-700 cursor-pointer">Grupo {g}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-md flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm mb-1">¡Precaución!</h4>
                            <p className="text-sm">
                                Modificar esto sobrescribirá el cálculo matemático automático (Puntos, DG, GF). 
                                El sistema respetará <strong>estrictamente</strong> el orden que definas aquí.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-md border border-slate-700">
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <div className="col-span-2 text-center">Posición</div>
                            <div className="col-span-4">Equipo</div>
                            <div className="col-span-6 text-right">Estadísticas (Ref)</div>
                        </div>
                        
                        {loading ? (
                             <div className="p-8 text-center text-slate-500">Cargando...</div>
                        ) : (
                            standings.map((team) => (
                                <div key={team.team} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-slate-700 last:border-0 hover:bg-slate-800/30 transition-colors">
                                    <div className="col-span-2 flex justify-center">
                                        <Input 
                                            type="number" 
                                            min="1"
                                            max="4"
                                            value={overrides[team.team] ?? team.position}
                                            onChange={(e) => handleRankChange(team.team, e.target.value)}
                                            className="h-10 w-16 text-center text-lg font-bold bg-slate-900 border-slate-600 text-white focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                                        />
                                    </div>
                                    <div className="col-span-4 font-medium text-base flex items-center gap-2">
                                        {team.team}
                                    </div>
                                    <div className="col-span-6 text-right text-sm text-slate-400 font-mono">
                                        <span className="text-white font-bold">{team.points} pts</span>
                                        <span className="mx-2 text-slate-600">|</span>
                                        DG: {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                                        <span className="mx-2 text-slate-600">|</span>
                                        GF: {team.goalsFor}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button 
                            onClick={loadStandings} 
                            variant="outline" 
                            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Recargar Original
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            className="bg-[#00E676] text-slate-900 hover:bg-[#00C853] font-bold"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Orden Oficial
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
