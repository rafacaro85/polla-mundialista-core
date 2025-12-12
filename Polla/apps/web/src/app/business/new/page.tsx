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
import { Building2, Phone, FileText, ArrowRight, Loader2 } from 'lucide-react';

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
                // NIT y Phone no están en el DTO de Liga por defecto, 
                // idealmente se guardarían en una tabla de 'EnterpriseDetails' o en el User Profile.
                // Por ahora, actualizaremos el teléfono del usuario.
            };

            const { data: leagueData } = await api.post('/leagues', leaguePayload);

            // 2. Intentar actualizar el teléfono del usuario (si el endpoint existe)
            if (formData.phoneNumber) {
                try {
                    // Asumiendo que existe PATCH /users/profile o similar
                    // await api.patch('/users/profile', { phoneNumber: formData.phoneNumber });
                    // Si no existe, lo ignoramos por ahora para no bloquear el flujo.
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-xl border-slate-200">
                <CardHeader className="space-y-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                        <Building2 size={24} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Configura tu Torneo Corporativo</CardTitle>
                    <CardDescription>
                        Estás a un paso de crear la mejor experiencia de integración para tu equipo.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">

                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nombre de la Empresa / Torneo</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="companyName"
                                    name="companyName"
                                    placeholder="Ej: TechSolutions World Cup"
                                    className="pl-9"
                                    required
                                    value={formData.companyName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nit">NIT / ID Tributario (Opcional)</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="nit"
                                    name="nit"
                                    placeholder="Para facturación futura"
                                    className="pl-9"
                                    value={formData.nit}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">WhatsApp / Teléfono de Contacto</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    placeholder="+57 300 123 4567"
                                    className="pl-9"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>
                            <p className="text-xs text-slate-500">Un asesor te contactará para activar tu plan.</p>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...
                                </>
                            ) : (
                                <>
                                    Crear Espacio <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
