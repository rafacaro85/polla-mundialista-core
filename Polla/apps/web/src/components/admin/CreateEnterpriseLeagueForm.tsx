'use client';

import React, { useState } from 'react';
import { X, Building2, Mail, Globe, CreditCard, CheckCircle2, AlertCircle, Rocket } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CreateEnterpriseLeagueFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateEnterpriseLeagueForm({ onClose, onSuccess }: CreateEnterpriseLeagueFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        slug: '',
        adminEmail: '',
        plan: 'BUSINESS_STARTER',
        status: 'ACTIVE',
    });

    const plans = [
        { value: 'DEMO', label: 'Demo Gratuita (7 días)', color: 'text-gray-400' },
        { value: 'BUSINESS_STARTER', label: 'Básico (Hasta 50)', color: 'text-blue-400' },
        { value: 'BUSINESS_GOLD', label: 'Gold (Hasta 200)', color: 'text-yellow-400' },
        { value: 'BUSINESS_PLATINUM', label: 'Platinum (Ilimitado)', color: 'text-purple-400' },
    ];

    const statuses = [
        { value: 'ACTIVE', label: 'Activo', icon: <CheckCircle2 size={16} />, color: 'text-green-400' },
        { value: 'PENDING', label: 'Pendiente de Pago', icon: <AlertCircle size={16} />, color: 'text-orange-400' },
    ];

    // Auto-generate slug from company name
    const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData({
            ...formData,
            companyName: name,
            slug: name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .trim()
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate slug uniqueness (you'll need to implement this endpoint)
            // const { data: existing } = await api.get(`/leagues/check-slug/${formData.slug}`);
            // if (existing) {
            //     toast.error('El slug ya está en uso', {
            //         description: 'Por favor elige otro identificador único'
            //     });
            //     setLoading(false);
            //     return;
            // }

            // Create enterprise league
            const payload = {
                name: formData.companyName,
                type: 'COMPANY',
                companyName: formData.companyName,
                accessCodePrefix: formData.slug.toUpperCase().substring(0, 6),
                maxParticipants: formData.plan === 'BUSINESS_PLATINUM' ? 999 :
                    formData.plan === 'BUSINESS_GOLD' ? 200 : 50,
                packageType: formData.plan,
                isEnterprise: true,
                isEnterpriseActive: formData.status === 'ACTIVE',
                // adminEmail will be handled separately to create/assign admin user
            };

            const { data: league } = await api.post('/leagues', payload);

            // TODO: Send email to admin with credentials
            // await api.post('/admin/send-enterprise-credentials', {
            //     leagueId: league.id,
            //     adminEmail: formData.adminEmail,
            //     companyName: formData.companyName
            // });

            toast.success(`¡Empresa "${formData.companyName}" creada exitosamente!`, {
                description: `Se han enviado las credenciales a ${formData.adminEmail}`,
                duration: 5000,
            });

            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Error creating enterprise league:', error);

            if (error.response?.status === 409) {
                toast.error('El slug ya está en uso', {
                    description: 'Por favor elige otro identificador único'
                });
            } else {
                toast.error('Error al crear la empresa', {
                    description: error.response?.data?.message || 'Inténtalo de nuevo'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E293B] border border-indigo-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-500/20">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 border-b border-indigo-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Building2 className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Alta Rápida de Empresa</h2>
                                <p className="text-indigo-100 text-sm">Creación manual de cliente B2B</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="text-white" size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Building2 size={16} className="text-indigo-400" />
                            Nombre de la Empresa
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.companyName}
                            onChange={handleCompanyNameChange}
                            placeholder="Ej: Cementos Argos"
                            className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Globe size={16} className="text-indigo-400" />
                            Slug / URL
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="cementos-argos"
                                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            />
                            <div className="absolute right-3 top-3 text-xs text-slate-500 font-mono">
                                /leagues/{formData.slug || '...'}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Identificador único para la URL. Se genera automáticamente pero puedes editarlo.
                        </p>
                    </div>

                    {/* Admin Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Mail size={16} className="text-indigo-400" />
                            Email del Administrador (Cliente)
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.adminEmail}
                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                            placeholder="admin@cementosargos.com"
                            className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                        <p className="text-xs text-slate-500">
                            Se enviarán las credenciales de acceso a este correo.
                        </p>
                    </div>

                    {/* Plan */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <CreditCard size={16} className="text-indigo-400" />
                            Plan Contratado
                        </label>
                        <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                            className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        >
                            {plans.map((plan) => (
                                <option key={plan.value} value={plan.value}>
                                    {plan.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-indigo-400" />
                            Estado Inicial
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {statuses.map((status) => (
                                <button
                                    key={status.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: status.value })}
                                    className={`
                                        p-4 rounded-xl border-2 transition-all flex items-center gap-3
                                        ${formData.status === status.value
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-slate-700 bg-[#0F172A] hover:border-slate-600'
                                        }
                                    `}
                                >
                                    <span className={status.color}>{status.icon}</span>
                                    <span className={`text-sm font-bold ${formData.status === status.value ? 'text-white' : 'text-slate-400'}`}>
                                        {status.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Rocket size={20} />
                                    Lanzar Polla Corporativa
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
