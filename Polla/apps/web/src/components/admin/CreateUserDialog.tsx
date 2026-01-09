
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserCreated: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [leagues, setLeagues] = useState<{ id: string, name: string }[]>([]);
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        nickname: '',
        password: '',
        role: 'PLAYER',
        leagueId: ''
    });

    React.useEffect(() => {
        if (open) {
            loadLeagues();
        }
    }, [open]);

    const loadLeagues = async () => {
        try {
            const { data } = await api.get('/leagues/all');
            setLeagues(data);
        } catch (error) {
            console.error('Error loading leagues', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (val: string) => {
        setFormData({ ...formData, role: val });
    };

    const handleLeagueChange = (val: string) => {
        setFormData({ ...formData, leagueId: val === 'none' ? '' : val });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Basic validation
        if (!formData.email || !formData.fullName) {
            toast.error('Nombre y Correo son obligatorios');
            setLoading(false);
            return;
        }


        try {
            await api.post('/users', formData);
            toast.success('Usuario creado exitosamente');
            onUserCreated();
            setFormData({ email: '', fullName: '', nickname: '', password: '', role: 'PLAYER', leagueId: '' }); // Reset
        } catch (error: any) {
            console.error('Error creating user:', error);
            const msg = error.response?.data?.message || 'Error al crear usuario';
            toast.error(typeof msg === 'object' ? JSON.stringify(msg) : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1E293B] border-slate-700 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Correo Electrónico *</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="ejemplo@correo.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-slate-300">Nombre Completo *</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="Juan Pérez"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nickname" className="text-slate-300">Apodo (Opcional)</Label>
                        <Input
                            id="nickname"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleChange}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="JuanP"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">Contraseña (Opcional)</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="Por defecto: polla123"
                        />
                        <p className="text-[10px] text-slate-500">Si se deja vacío, será 'polla123'</p>
                    </div>


                    <div className="space-y-2">
                        <Label className="text-slate-300">Asignar a Polla (Opcional)</Label>
                        <Select value={formData.leagueId || 'none'} onValueChange={handleLeagueChange}>
                            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                <SelectValue placeholder="Seleccionar Polla" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[200px]">
                                <SelectItem value="none">-- Ninguna --</SelectItem>
                                {leagues.map((league: any) => (
                                    <SelectItem key={league.id} value={league.id}>
                                        {league.name} ({league.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">Rol</Label>
                        <Select value={formData.role} onValueChange={handleRoleChange}>
                            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                <SelectValue placeholder="Seleccionar Rol" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                <SelectItem value="PLAYER">Jugador</SelectItem>
                                <SelectItem value="ADMIN">Administrador</SelectItem>
                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Usuario
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
