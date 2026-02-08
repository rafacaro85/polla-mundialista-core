"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Send, Users, AlertTriangle, CheckCircle, Info, Gift } from 'lucide-react';

export function CommunicationPanel() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<'ALL' | 'FREE' | 'PAID' | 'TOURNAMENT'>('ALL');
    const [selectedTournament, setSelectedTournament] = useState<'WC2026' | 'UCL2526' | ''>('');
    const [type, setType] = useState<'INFO' | 'SUCCESS' | 'WARNING' | 'PROMO'>('INFO');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        setIsLoading(true);
        try {
            const endpoint = '/notifications/admin/broadcast';
            const payload = {
                title,
                message,
                type,
                targetAudience: audience === 'TOURNAMENT' ? 'ALL' : audience,
                tournamentId: (audience === 'TOURNAMENT' || selectedTournament) ? selectedTournament : undefined
            };

            const response = await api.post(endpoint, payload);
            
            toast.success(`Mensaje enviado a ${response.data.count} usuarios`);
            
            // Reset form
            setTitle('');
            setMessage('');
            setAudience('ALL');
            setType('INFO');

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error al enviar broadcast");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Megaphone className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-russo">
                        Centro de Comunicaciones
                    </h1>
                    <p className="text-slate-400">Envía notificaciones masivas a los usuarios de la plataforma</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* FORMULARIO */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Send size={18} /> Redactar Mensaje
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Título</Label>
                            <Input 
                                placeholder="Ej: ¡Ya comenzó la fase final!" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Mensaje</Label>
                            <textarea 
                                className="flex min-h-[120px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm ring-offset-background placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                placeholder="Escribe aquí tu mensaje... (Soporta links https://...)"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <p className="text-xs text-slate-500">
                                Tip: Las URLs (https://...) se convertirán automáticamente en enlaces clicables.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Audiencia</Label>
                                <Select value={audience} onValueChange={(val: any) => setAudience(val)}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="ALL">Todos los Usuarios</SelectItem>
                                        <SelectItem value="FREE">Solo Gratuitos</SelectItem>
                                        <SelectItem value="PAID">Solo Pagos (Premium)</SelectItem>
                                        <SelectItem value="TOURNAMENT">Por Torneo Específico</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {audience === 'TOURNAMENT' && (
                                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                                    <Label className="text-slate-300">Seleccionar Torneo</Label>
                                    <Select value={selectedTournament} onValueChange={(val: any) => setSelectedTournament(val)}>
                                        <SelectTrigger className="bg-slate-950 border-blue-500 text-white">
                                            <SelectValue placeholder="Elegir Torneo" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                            <SelectItem value="WC2026">🏆 Mundial 2026</SelectItem>
                                            <SelectItem value="UCL2526">⚽ Champions League 25/26</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-slate-300">Tipo de Alerta</Label>
                                <Select value={type} onValueChange={(val: any) => setType(val)}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="INFO">Información (Azul)</SelectItem>
                                        <SelectItem value="SUCCESS">Éxito (Verde)</SelectItem>
                                        <SelectItem value="WARNING">Advertencia (Naranja)</SelectItem>
                                        <SelectItem value="PROMO">Promoción (Amarillo)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button 
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6"
                            onClick={handleSend}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Enviando...' : 'Enviar Broadcast'}
                        </Button>
                    </CardContent>
                </Card>

                {/* PREVIEW */}
                <Card className="bg-slate-900 border-slate-800 h-fit">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Users size={18} /> Vista Previa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 rounded-xl border border-slate-700 bg-slate-950">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    type === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-500' :
                                    type === 'WARNING' ? 'bg-amber-500/20 text-amber-500' :
                                    type === 'PROMO' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-blue-500/20 text-blue-500'
                                }`}>
                                    {type === 'SUCCESS' && <CheckCircle size={20} />}
                                    {type === 'WARNING' && <AlertTriangle size={20} />}
                                    {type === 'PROMO' && <Gift size={20} />}
                                    {type === 'INFO' && <Info size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm mb-1">
                                        {title || 'Título de la notificación'}
                                    </h4>
                                    <p className="text-slate-400 text-sm whitespace-pre-wrap">
                                        {message || 'Aquí aparecerá el cuerpo del mensaje que verán los usuarios...'}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-2">Hace unos segundos</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-dashed border-slate-700">
                            <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">Resumen del Envío</h4>
                            <ul className="text-sm text-slate-300 space-y-1">
                                <li>🎯 Audiencia: <strong className="text-white">
                                    {audience === 'ALL' ? 'Todos' : 
                                     audience === 'FREE' ? 'Gratuitos' : 
                                     audience === 'PAID' ? 'Pagos' : 
                                     'Por Torneo'}
                                </strong></li>
                                {audience === 'TOURNAMENT' && (
                                    <li>🏆 Torneo: <strong className="text-[var(--brand-primary,#00E676)]">
                                        {selectedTournament === 'WC2026' ? 'Mundial 2026' : 'Champions League'}
                                    </strong></li>
                                )}
                                <li>🎨 Tipo: <strong className="text-white">{type}</strong></li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
