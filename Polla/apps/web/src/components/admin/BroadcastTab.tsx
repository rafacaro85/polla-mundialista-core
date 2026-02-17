"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Send, Bell, Megaphone, ExternalLink } from 'lucide-react';
import { CommunicationPanel } from './CommunicationPanel';

export function BroadcastTab({ tournamentId }: { tournamentId?: string }) {
    const [activeSubTab, setActiveSubTab] = useState<'internal' | 'external'>('internal');

    // External Email State
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailTarget, setEmailTarget] = useState<'ALL' | 'NO_PREDICTION' | 'NO_BRACKET' | 'FREE_BRACKET' | 'PAID_BRACKET'>('ALL');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // WhatsApp State
    const [waMessage, setWaMessage] = useState('');

    const handleSendEmail = async () => {
        if (!emailSubject.trim() || !emailMessage.trim()) {
            toast.error("Completa el asunto y el mensaje");
            return;
        }

        setIsSendingEmail(true);
        try {
            const response = await api.post('/admin/broadcast', {
                subject: emailSubject,
                message: emailMessage,
                target: emailTarget,
                tournamentId: tournamentId
            });
            toast.success(response.data.message || "Correos enviados");
            setEmailSubject('');
            setEmailMessage('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al enviar correos");
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleOpenWhatsApp = () => {
        if (!waMessage.trim()) {
            toast.error("Escribe un mensaje para WhatsApp");
            return;
        }
        const encoded = encodeURIComponent(waMessage);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    };

    const tournamentName = tournamentId === 'WC2026' ? 'Mundial' : 'Champions';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Megaphone className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-russo text-white uppercase tracking-wider">Centro de Difusión</h1>
                        <p className="text-slate-400 text-sm">Gestiona comunicaciones del torneo <strong className="text-emerald-500">{tournamentName}</strong>.</p>
                    </div>
                </div>

                {/* Sub-Tabs Navigation */}
                <div className="flex bg-[#0F172A] border border-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveSubTab('internal')}
                        className={`px-4 py-2 rounded-md text-xs font-black uppercase transition-all flex items-center gap-2 ${
                            activeSubTab === 'internal'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Bell size={14} /> Notificaciones
                    </button>
                    <button
                        onClick={() => setActiveSubTab('external')}
                        className={`px-4 py-2 rounded-md text-xs font-black uppercase transition-all flex items-center gap-2 ${
                            activeSubTab === 'external'
                                ? 'bg-emerald-600 text-slate-900 shadow-lg'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Mail size={14} /> Email / WhatsApp
                    </button>
                </div>
            </div>

            <div className="h-px bg-slate-800 w-full" />

            {/* TAB CONTENT: INTERNAL */}
            {activeSubTab === 'internal' && (
                <div className="animate-in slide-in-from-left-4 duration-300">
                    <CommunicationPanel tournamentId={tournamentId} />
                </div>
            )}

            {/* TAB CONTENT: EXTERNAL */}
            {activeSubTab === 'external' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                    {/* EMAIL BROADCAST */}
                    <Card className="bg-[#1E293B] border-slate-700 shadow-2xl">
                        <CardHeader className="border-b border-slate-800 pb-4">
                            <CardTitle className="text-white flex items-center gap-2 text-lg">
                                <Mail size={20} className="text-emerald-400" /> Envío Masivo de Emails
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-[10px] font-bold uppercase ml-1">Asunto del Correo</Label>
                                <Input 
                                    placeholder="Ej: ¡Última oportunidad para crear tu polla!" 
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="bg-[#0F172A] border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500 h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-[10px] font-bold uppercase ml-1">Segmentación (Target)</Label>
                                <Select value={emailTarget} onValueChange={(val: any) => setEmailTarget(val)}>
                                    <SelectTrigger className="bg-[#0F172A] border-slate-800 text-white h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0F172A] border-slate-800 text-white">
                                        <SelectItem value="ALL">👥 Todos los Usuarios Verificados</SelectItem>
                                        <SelectItem value="NO_BRACKET">🛑 Sin Polla ({tournamentName})</SelectItem>
                                        <SelectItem value="NO_PREDICTION">📝 Sin Predicciones ({tournamentName})</SelectItem>
                                        <SelectItem value="FREE_BRACKET">🎁 Solo Pollas GRATIS ({tournamentName})</SelectItem>
                                        <SelectItem value="PAID_BRACKET">⭐ Con Pollas PAGAS ({tournamentName})</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-[10px] font-bold uppercase ml-1">Cuerpo del Mensaje (HTML soportado)</Label>
                                <textarea 
                                    className="flex min-h-[200px] w-full rounded-md border border-slate-800 bg-[#0F172A] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="Escribe tu mensaje aquí..."
                                    value={emailMessage}
                                    onChange={(e) => setEmailMessage(e.target.value)}
                                />
                            </div>

                            <Button 
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black py-6 transition-all shadow-lg shadow-emerald-600/20"
                                onClick={handleSendEmail}
                                disabled={isSendingEmail}
                            >
                                {isSendingEmail ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                        ENVIANDO...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Send size={18} /> ENVIAR CORREOS AHORA
                                    </div>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* WHATSAPP BROADCAST */}
                    <Card className="bg-[#1E293B] border-slate-700 shadow-2xl h-fit">
                        <CardHeader className="border-b border-slate-800 pb-4">
                            <CardTitle className="text-white flex items-center gap-2 text-lg">
                                <MessageSquare size={20} className="text-[#25D366]" /> Difusión por WhatsApp
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                <p className="text-xs text-emerald-400 leading-relaxed font-medium">
                                    Esta herramienta genera un enlace directo para abrir WhatsApp Web con un mensaje pre-cargado. 
                                    Ideal para compartir en estados o enviar rápidamente a grupos de soporte.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-[10px] font-bold uppercase ml-1">Texto para WhatsApp</Label>
                                <textarea 
                                    className="flex min-h-[200px] w-full rounded-md border border-slate-800 bg-[#0F172A] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                                    placeholder="Escribe el mensaje que quieres difundir..."
                                    value={waMessage}
                                    onChange={(e) => setWaMessage(e.target.value)}
                                />
                            </div>

                            <Button 
                                variant="outline"
                                className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-black py-6 transition-all"
                                onClick={handleOpenWhatsApp}
                            >
                                <ExternalLink size={18} className="mr-2" /> ABRIR WHATSAPP WEB
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
