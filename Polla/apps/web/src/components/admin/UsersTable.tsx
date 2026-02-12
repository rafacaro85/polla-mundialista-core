
"use client";

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import {
    Loader2, Search, Edit3, CheckCircle, Ban, Trash2,
    Users, ShieldCheck, UserX, Plus, Eye, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { EditUserDialog } from './EditUserDialog';
import { CreateUserDialog } from './CreateUserDialog';
import { UserDetailDialog } from './UserDetailDialog';
import { cn } from "@/lib/utils";

interface User {
    id: string;
    email: string;
    fullName: string;
    nickname?: string;
    role: string;
    avatarUrl?: string;
    status: string; // 'ACTIVE' | 'BANNED'
    isBanned?: boolean; // From API
    phoneNumber?: string;
}

export function UsersTable({ tournamentId }: { tournamentId?: string }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailUserId, setDetailUserId] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const { data } = await api.get('/users');
            // Map API response to Component State
            const mappedUsers = data.map((u: any) => ({
                ...u,
                status: u.isBanned ? 'BANNED' : 'ACTIVE'
            }));
            setUsers(mappedUsers);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setCreateDialogOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    const handleUserUpdated = () => {
        loadUsers();
        setEditDialogOpen(false);
        setSelectedUser(null);
    };

    const handleUserCreated = () => {
        loadUsers();
        setCreateDialogOpen(false);
    };

    const handleBan = async (user: User) => {
        const isBanned = user.status === 'BANNED';
        const action = isBanned ? 'activar' : 'bloquear';

        // Toggle logic
        const newIsBanned = !isBanned;

        if (!confirm(`¿Estás seguro de ${action} a este usuario?`)) return;

        try {
            await api.patch(`/users/${user.id}`, { isBanned: newIsBanned });
            toast.success(`Usuario ${isBanned ? 'activado' : 'bloqueado'} exitosamente`);
            loadUsers();
        } catch (error) {
            toast.error(`Error al ${action} usuario`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            toast.success('Usuario eliminado');
            loadUsers();
        } catch (error) {
            toast.error('Error al eliminar usuario');
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(user =>
        (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.nickname || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status !== 'BANNED').length;
    const bannedUsers = users.filter(u => u.status === 'BANNED').length;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#00E676]" />
            </div>
        );
    }

    // Styles for consistent look
    const STYLES = {
        statCard: "bg-[#1E293B] border border-slate-700/50 rounded-xl p-4 flex items-center justify-between shadow-sm",
        statTitle: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1",
        statValue: "text-2xl font-russo text-white",
        statIconBox: "w-10 h-10 rounded-lg flex items-center justify-center",
        primaryBtn: "w-full bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] font-bold text-xs uppercase h-10 rounded-xl transition-all active:scale-95 shadow-[0_0_15px_rgba(0,230,118,0.2)]",
        secondaryBtn: "w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs uppercase h-10 rounded-xl transition-all active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
        whatsappBtn: "w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs uppercase h-10 rounded-xl transition-all active:scale-95 shadow-[0_0_15px_rgba(37,211,102,0.2)]"
    };

    return (
        <div className="space-y-6 pb-24 font-sans max-w-5xl mx-auto">

            {/* 1. HEADER & STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total */}
                <div className={STYLES.statCard}>
                    <div>
                        <p className={STYLES.statTitle}>Total Usuarios</p>
                        <p className={STYLES.statValue}>{totalUsers}</p>
                    </div>
                    <div className={`${STYLES.statIconBox} bg-indigo-500/10 text-indigo-400 border border-indigo-500/30`}>
                        <Users size={20} />
                    </div>
                </div>

                {/* Activos */}
                <div className={STYLES.statCard}>
                    <div>
                        <p className={STYLES.statTitle}>Activos</p>
                        <p className={STYLES.statValue}>{activeUsers}</p>
                    </div>
                    <div className={`${STYLES.statIconBox} bg-emerald-500/10 text-emerald-400 border border-emerald-500/30`}>
                        <ShieldCheck size={20} />
                    </div>
                </div>

                {/* Bloqueados */}
                <div className={STYLES.statCard}>
                    <div>
                        <p className={STYLES.statTitle}>Bloqueados</p>
                        <p className={STYLES.statValue}>{bannedUsers}</p>
                    </div>
                    <div className={`${STYLES.statIconBox} bg-red-500/10 text-red-500 border border-red-500/30`}>
                        <UserX size={20} />
                    </div>
                </div>
            </div>

            {/* 2. ACTIONS BAR */}
            <div className="bg-[#1E293B] border border-slate-700/50 rounded-xl p-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o nickname..."
                        className="w-full h-10 pl-10 pr-4 bg-[#0F172A] border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-[#00E676] transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                    {/* Botones de acción rápida estilo referencia */}

                    <Button onClick={handleCreate} className="bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] font-bold h-10 px-4 rounded-lg flex gap-2">
                        <Plus size={16} /> <span className="hidden sm:inline">Nuevo Usuario</span>
                    </Button>
                </div>
            </div>

            {/* 3. USER LIST (CARD DESIGN) */}
            <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 bg-[#1E293B]/50 rounded-xl border border-dashed border-slate-700">
                        <Users size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-400 font-medium">No se encontraron usuarios</p>
                    </div>
                ) : (
                    filteredUsers.map(user => {
                        const isBanned = user.status === 'BANNED';
                        const roleColor = user.role === 'SUPER_ADMIN' ? 'text-amber-400 border-amber-500/50 bg-amber-500/10' :
                            user.role === 'ADMIN' ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' :
                                'text-slate-400 border-slate-700 bg-slate-800';

                        return (
                            <div key={user.id} className="bg-[#1E293B] border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors group">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                                    {/* 1. NOMBRE & ROL (3 cols) */}
                                    <div className="md:col-span-3 flex items-center gap-3 overflow-hidden">
                                        <Avatar className={cn("h-10 w-10 border-2 shrink-0", isBanned ? "border-red-500/50 grayscale" : "border-slate-600")}>
                                            <AvatarImage src={user.avatarUrl} />
                                            <AvatarFallback className="bg-slate-800 text-slate-400 font-bold">{user.fullName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <h3 className={cn("font-bold text-sm truncate", isBanned ? "text-slate-500 line-through" : "text-white")} title={user.fullName}>
                                                {user.fullName || 'Sin Nombre'}
                                            </h3>
                                            <span className={cn("text-[9px] px-1.5 w-fit rounded font-black border uppercase tracking-wider", roleColor)}>
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 2. USUARIO (2 cols) */}
                                    <div className="md:col-span-2 text-sm min-w-0">
                                        {user.nickname ? (
                                            <span className="text-emerald-500/80 font-medium truncate block" title={`@${user.nickname}`}>
                                                @{user.nickname}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 italic text-xs">-</span>
                                        )}
                                    </div>

                                    {/* 3. CORREO (3 cols) */}
                                    <div className="md:col-span-3 text-xs min-w-0">
                                        <span className="text-slate-400 font-mono truncate block" title={user.email}>
                                            {user.email}
                                        </span>
                                    </div>

                                    {/* 4. WHATSAPP (2 cols) */}
                                    <div className="md:col-span-2 min-w-0">
                                        {user.phoneNumber ? (
                                            <a
                                                href={`https://wa.me/57${user.phoneNumber.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[#25D366] font-bold text-xs bg-[#25D366]/10 px-2 py-1 rounded-md hover:bg-[#25D366]/20 transition-colors"
                                            >
                                                <MessageCircle size={12} />
                                                <span className="font-mono">{user.phoneNumber}</span>
                                            </a>
                                        ) : (
                                            <span className="text-slate-600 text-xs">-</span>
                                        )}
                                    </div>

                                    {/* 5. ESTADO & ACCIONES (2 cols) */}
                                    <div className="md:col-span-2 flex flex-col md:flex-row items-center justify-end gap-2 mt-4 md:mt-0">
                                        {/* Mobile Status Badge */}
                                        <div className="md:hidden w-full mb-2">
                                            {isBanned ? (
                                                <div className="text-center text-xs font-bold text-red-500 bg-red-500/10 py-1 rounded border border-red-500/20 uppercase">Bloqueado</div>
                                            ) : (
                                                <div className="text-center text-xs font-bold text-emerald-500 bg-emerald-500/10 py-1 rounded border border-emerald-500/20 uppercase">Activo</div>
                                            )}
                                        </div>

                                        {/* Desktop Status Badge (Hidden on Mobile) */}
                                        <div className="hidden md:block mr-2">
                                            {isBanned ? (
                                                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase">BLOQUEADO</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">ACTIVO</span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-4 md:flex items-center gap-1 w-full md:w-auto">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setDetailUserId(user.id); setDetailDialogOpen(true); }}
                                                className="h-9 md:h-8 w-full md:w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 md:border-none"
                                                title="Ver Detalles"
                                            >
                                                <Eye size={16} className="md:h-4 md:w-4" />
                                                <span className="md:hidden ml-1 text-xs font-bold">VER</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(user)}
                                                className="h-9 md:h-8 w-full md:w-8 text-blue-400 hover:text-white hover:bg-blue-500/20 border border-slate-700 md:border-none"
                                                title="Editar"
                                            >
                                                <Edit3 size={16} className="md:h-4 md:w-4" />
                                                <span className="md:hidden ml-1 text-xs font-bold">EDITAR</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleBan(user)}
                                                className={cn("h-9 md:h-8 w-full md:w-8 border md:border-none", isBanned ? "text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20" : "text-amber-400 hover:bg-amber-500/20 border-amber-500/20")}
                                                title={isBanned ? "Activar" : "Bloquear"}
                                            >
                                                {isBanned ? <CheckCircle size={16} className="md:h-4 md:w-4" /> : <Ban size={16} className="md:h-4 md:w-4" />}
                                                <span className="md:hidden ml-1 text-xs font-bold">{isBanned ? 'ACTIVAR' : 'BLOQ.'}</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(user.id)}
                                                className="h-9 md:h-8 w-full md:w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 md:border-none"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} className="md:h-4 md:w-4" />
                                                <span className="md:hidden ml-1 text-xs font-bold">BORRAR</span>
                                            </Button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedUser && (
                <EditUserDialog
                    user={selectedUser}
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    onUserUpdated={handleUserUpdated}
                />
            )}

            <CreateUserDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onUserCreated={handleUserCreated}
            />

            <UserDetailDialog
                userId={detailUserId}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
            />
        </div>
    );
}
