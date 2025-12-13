'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, Phone, FileText, ArrowRight, Loader2, Trophy, ShieldCheck } from 'lucide-react';

export default function BusinessOnboardingPage() {
    const router = useRouter();
    const { user } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        nit: '',
        phoneNumber: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Crear la liga tipo COMPANY
            const leaguePayload = {
                name: formData.companyName,
                type: 'COMPANY',
                maxParticipants: 50, // Default inicial
                packageType: 'BUSINESS_STARTER',
                isEnterprise: true,
                companyName: formData.companyName,
            };

            const { data: leagueData } = await api.post('/leagues', leaguePayload);

            // 2. Intentar actualizar el teléfono del usuario
            if (formData.phoneNumber) {
                try {
                    // await api.patch('/users/profile', { phoneNumber: formData.phoneNumber });
                    console.log('Phone number captured:', formData.phoneNumber);
                } catch (err) {
                    console.warn('Could not update phone number', err);
                }
            }

            toast.success('¡Espacio corporativo creado!', {
                description: 'Personaliza tu marca mientras validamos tu cuenta.'
            });

            // 3. Redirigir al Studio
            router.push(`/leagues/${leagueData.id}/studio`);

        } catch (error: any) {
            console.error('Error creando empresa:', error);
            toast.error('Error al crear el espacio', {
                description: error.response?.data?.message || 'Inténtalo de nuevo.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#00E676] selection:text-[#0F172A]">
            {/* Inject Fonts */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Russo+One&display=swap');
                .font-russo { font-family: 'Russo One', sans-serif; }
            `}</style>

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E676] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

            <Card className="w-full max-w-2xl shadow-2xl bg-[#1E293B] border border-[#94A3B8]/20 relative z-10">
                <CardHeader className="space-y-1 text-center pb-8">
                    <div className="mx-auto w-16 h-16 bg-[#00E676]/10 rounded-2xl flex items-center justify-center mb-4 text-[#00E676] border border-[#00E676]/20 shadow-[0_0_15px_rgba(0,230,118,0.1)]">
                        <Building2 size={32} />
                    </div>
                    <CardTitle className="text-2xl lg:text-3xl font-russo text-white tracking-wide">
                        CONFIGURA TU <br /> <span className="text-[#00E676]">TORNEO CORPORATIVO</span>
                    </CardTitle>
                    <CardDescription className="text-[#94A3B8] text-base">
                        Estás a un paso de crear la mejor experiencia de integración para tu equipo.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5">

                        {/* Company Name Input */}
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-[#94A3B8] font-bold text-xs uppercase tracking-wider ml-1">
                                Nombre de la Empresa / Torneo
                            </Label>
                            <div className="relative group">
                                <Trophy className="absolute left-3 top-3 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#00E676] transition-colors" />
                                <Input
                                    id="companyName"
                                    name="companyName"
                                    placeholder="Ej: TechSolutions World Cup"
                                    className="pl-10 bg-[#0F172A] border-[#94A3B8]/20 text-white placeholder:text-[#94A3B8]/40 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] h-12 rounded-xl transition-all"
                                    required
                                    value={formData.companyName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* NIT Input */}
                        <div className="space-y-2">
                            <Label htmlFor="nit" className="text-[#94A3B8] font-bold text-xs uppercase tracking-wider ml-1">
                                NIT / ID Tributario (Opcional)
                            </Label>
                            <div className="relative group">
                                <FileText className="absolute left-3 top-3 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#00E676] transition-colors" />
                                <Input
                                    id="nit"
                                    name="nit"
                                    placeholder="Para facturación futura"
                                    className="pl-10 bg-[#0F172A] border-[#94A3B8]/20 text-white placeholder:text-[#94A3B8]/40 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] h-12 rounded-xl transition-all"
                                    value={formData.nit}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber" className="text-[#94A3B8] font-bold text-xs uppercase tracking-wider ml-1">
                                WhatsApp / Teléfono de Contacto
                            </Label>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-3 h-5 w-5 text-[#94A3B8] group-focus-within:text-[#00E676] transition-colors" />
                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    placeholder="+57 300 123 4567"
                                    className="pl-10 bg-[#0F172A] border-[#94A3B8]/20 text-white placeholder:text-[#94A3B8]/40 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] h-12 rounded-xl transition-all"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>
                            <p className="text-[10px] text-[#94A3B8]/70 flex items-center gap-1 mt-1 ml-1">
                                <ShieldCheck size={12} /> Un asesor te contactará para activar tu plan.
                            </p>
                        </div>

                    </CardContent>

                    <CardFooter className="pb-8 pt-2">
                        <Button
                            className="w-full bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] font-black uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-all"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creando Espacio...
                                </>
                            ) : (
                                <>
                                    Crear Espacio Corporativo <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
