'use client';


import React, { useState, useEffect } from 'react';
import { Save, X, Users, Copy, Loader2, Image, Gift, MessageSquare, Briefcase, Trophy, UploadCloud } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

interface League {
    id: string;
    name: string;
    code?: string;
    admin?: string;
    members?: number;
    capacity?: number;
    type?: string;
    creator?: {
        nickname: string;
    };
    participantCount?: number;
    maxParticipants?: number;
    brandingLogoUrl?: string;
    prizeImageUrl?: string;
    prizeDetails?: string;
    welcomeMessage?: string;
}

interface EditLeagueDialogProps {
    league: League;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

/* =============================================================================
   COMPONENTE: MODAL EDITAR LIGA (TACTICAL STYLE)
   ============================================================================= */
export function EditLeagueDialog({ league, open, onOpenChange, onSuccess }: EditLeagueDialogProps) {

    // Estados del formulario
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        admin: '',
        members: 0,
        capacity: 0,
        type: 'private',
        brandingLogoUrl: '',
        prizeImageUrl: '',
        prizeDetails: '',
        welcomeMessage: ''
    });

    useEffect(() => {
        if (league) {
            setFormData({
                name: league.name || '',
                code: league.code || '',
                admin: league.creator?.nickname || league.admin || '',
                members: league.participantCount || league.members || 0,
                capacity: league.maxParticipants || league.capacity || 20,
                type: league.type || 'private',
                brandingLogoUrl: league.brandingLogoUrl || '',
                prizeImageUrl: league.prizeImageUrl || '',
                prizeDetails: league.prizeDetails || '',
                welcomeMessage: league.welcomeMessage || ''
            });
        }
    }, [league, open]);

    if (!open || !league) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Función de compresión (Duplicada desde LeagueBrandingForm para consistencia)
    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new window.Image(); // Use window.Image explícitamente
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1200;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Canvas context failed'));
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Blob creation failed'));
                    }, 'image/jpeg', 0.85); // Calidad 0.85
                };
                img.onerror = () => reject(new Error('Image load failed'));
                img.src = event.target?.result as string;
            };
            reader.onerror = () => reject(new Error('File read failed'));
        });
    };

    const handleFileUpload = async (file: File, field: string) => {
        try {
            setLoading(true);

            let fileToUpload: File | Blob = file;
            let filename = file.name;

            // Intentar comprimir
            try {
                const compressed = await compressImage(file);
                fileToUpload = compressed;
                filename = `upload_${Date.now()}.jpg`; // Renombrar si se comprime a jpg
            } catch (e) {
                console.warn('Falló compresión, usando original:', e);
            }

            const uploadData = new FormData();
            // Es vital pasar el filename si es un Blob
            uploadData.append('file', fileToUpload, filename);

            // IMPORTANTE: No pasar headers manuales para multipart/form-data, 
            // Axios/Browser lo maneja para incluir el boundary correcto.
            const response = await api.post('/upload', uploadData);

            if (response.data && response.data.url) {
                setFormData(prev => ({ ...prev, [field]: response.data.url }));
                toast.success('Imagen subida correctamente');
            } else {
                throw new Error('No se recibió URL de la imagen');
            }
        } catch (error: any) {
            console.error('Error uploading file:', error);
            const msg = error.response?.data?.message || error.message || 'Error al subir la imagen';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre no puede estar vacío');
            return;
        }

        setLoading(true);
        try {
            await api.patch(`/leagues/${league.id}`, {
                name: formData.name,
                brandingLogoUrl: formData.brandingLogoUrl,
                prizeImageUrl: formData.prizeImageUrl,
                prizeDetails: formData.prizeDetails,
                welcomeMessage: formData.welcomeMessage
            });
            toast.success(`Liga actualizada a "${formData.name}"`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error updating league:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar la liga');
        } finally {
            setLoading(false);
        }
    };

    // NO STYLES object needed anymore

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0F172A] border-slate-800 text-white p-0 overflow-hidden sm:max-w-[500px] max-h-[90vh] flex flex-col sm:rounded-2xl gap-0">

                {/* HEAD */}
                <div className="bg-[#0F172A] p-6 border-b border-slate-800 relative">
                    <DialogClose className="absolute right-4 top-4 text-slate-400 hover:text-white opacity-70 hover:opacity-100 transition-opacity">
                        <X size={18} />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                            {/* Usar logo si hay, sino icono por defecto */}
                            {formData.brandingLogoUrl ? (
                                <img src={formData.brandingLogoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <Briefcase size={20} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-emerald-500 font-bold text-sm tracking-wider flex items-center gap-2">
                                GESTIÓN DE POLLA
                            </h2>
                            <p className="text-slate-400 text-xs font-mono">{formData.name || 'Nueva Liga'}</p>
                        </div>
                    </div>
                </div>

                {/* BODY SCROLLABLE */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* SECTION 1: NOMBRE */}
                    <div className="space-y-4">
                        <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700/50 space-y-3">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre de la Polla</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-[#0F172A] border-slate-700 font-bold text-white h-11 focus-visible:ring-emerald-500/50"
                                    placeholder="Nombre de la liga..."
                                />
                                <Button size="icon" className="h-11 w-11 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 shrink-0">
                                    <Save size={18} onClick={handleSubmit} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: PERSONALIZACIÓN VISUAL */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
                                <Gift size={16} />
                            </span>
                            <h3 className="text-emerald-500 font-bold text-sm">Personalización Visual</h3>
                        </div>

                        {/* LOGO */}
                        <div className="bg-[#1E293B] p-5 rounded-xl border border-slate-700/50 space-y-4">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                Logo Identitario de la Polla
                            </Label>

                            <div className="border border-dashed border-slate-700 bg-[#0F172A] rounded-lg h-32 flex flex-col items-center justify-center gap-3 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                                {formData.brandingLogoUrl && (
                                    <div className="absolute inset-0 w-full h-full bg-[#0F172A] z-0">
                                        <img src={formData.brandingLogoUrl} className="w-full h-full object-contain opacity-50 group-hover:opacity-30 transition-opacity p-4" />
                                    </div>
                                )}
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <p className="text-xs text-slate-500 max-w-[200px] text-center">
                                        {formData.brandingLogoUrl ? 'Click para cambiar el logo' : 'Sube un logo (PNG, JPG)'}
                                    </p>
                                    <Button variant="outline" size="sm" className="bg-slate-800 border-slate-600 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 hover:bg-slate-800 relative">
                                        <UploadCloud size={14} className="mr-2" />
                                        {formData.brandingLogoUrl ? 'CAMBIAR LOGO' : 'SUBIR LOGO'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'brandingLogoUrl')}
                                        />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* PREMIO IMAGE */}
                        <div className="bg-[#1E293B] p-5 rounded-xl border border-slate-700/50 space-y-4">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                Imagen del Premio Principal
                            </Label>

                            <div className="border border-dashed border-slate-700 bg-[#0F172A] rounded-lg h-40 flex flex-col items-center justify-center gap-3 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                                {formData.prizeImageUrl && (
                                    <div className="absolute inset-0 w-full h-full bg-[#0F172A] z-0">
                                        <img src={formData.prizeImageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                    </div>
                                )}
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <Button className="bg-[#0F172A] border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 w-full relative group-hover:scale-105 transition-transform">
                                        <Image size={16} className="mr-2" />
                                        SUBIR FOTO DEL PREMIO
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'prizeImageUrl')}
                                        />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* DETALLES DEL PREMIO */}
                        <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700/50 space-y-3">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Gift size={12} className="text-emerald-500" /> Detalles del Premio
                            </Label>
                            <textarea
                                name="prizeDetails"
                                value={formData.prizeDetails}
                                onChange={handleChange}
                                placeholder="Ej: Viaje a San Andrés para 2 personas..."
                                className="flex min-h-[80px] w-full rounded-md border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 border-input disabled:cursor-not-allowed disabled:opacity-50 resize-none font-medium"
                            />
                        </div>

                        {/* MENSAJE DE BIENVENIDA */}
                        <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700/50 space-y-3">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare size={12} className="text-emerald-500" /> Mensaje de Bienvenida
                            </Label>
                            <textarea
                                name="welcomeMessage"
                                value={formData.welcomeMessage}
                                onChange={handleChange}
                                placeholder="Escribe un saludo para tus jugadores..."
                                className="flex min-h-[80px] w-full rounded-md border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 border-input disabled:cursor-not-allowed disabled:opacity-50 resize-none font-medium"
                            />
                        </div>

                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 bg-[#0F172A] border-t border-slate-800 flex justify-between items-center z-10">
                    <div className="py-2 px-3 bg-yellow-500/10 text-yellow-500 text-[10px] rounded border border-yellow-500/20 font-mono hidden sm:block">
                        MODE: SUPER_ADMIN
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none text-slate-400 hover:text-white hover:bg-slate-800">
                            CANCELAR
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                            GUARDAR CAMBIOS
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
