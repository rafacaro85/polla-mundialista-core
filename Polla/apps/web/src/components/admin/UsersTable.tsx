"use client";

import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Loader2, Search, Edit3, CheckCircle, Ban, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EditUserDialog } from './EditUserDialog';

interface User {
    id: string;
    email: string;
    fullName: string;
    nickname?: string;
    phoneNumber?: string;
    role: string;
    avatarUrl?: string;
    status: string; // 'ACTIVE' | 'BANNED' | 'INACTIVE'
}

export function UsersTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
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

    const handleBan = async (user: User) => {
        const isBanned = user.status === 'BANNED';
        const action = isBanned ? 'activar' : 'bloquear';
        const newStatus = isBanned ? 'ACTIVE' : 'BANNED';

        if (!confirm(`¿Estás seguro de ${action} a este usuario?`)) return;

        try {
            await api.put(`/users/${user.id}/status`, { status: newStatus });
            toast.success(`Usuario ${isBanned ? 'activado' : 'bloqueado'} exitosamente`);
            loadUsers();
        } catch (error) {
            console.error(`Error al ${action} usuario:`, error);
            toast.error(`Error al ${action} usuario`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            // await api.delete(`/users/${id}`); // Descomentar cuando exista el endpoint
            toast.info('Funcionalidad de eliminar pendiente de backend');
            // setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            toast.error('Error al eliminar usuario');
        }
    };

    // Filtrar usuarios
    const filteredUsers = users.filter(user =>
        (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- SISTEMA DE DISEÑO (ESTILOS BLINDADOS) ---
    const STYLES = {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '16px',
            paddingBottom: '100px',
            fontFamily: 'sans-serif'
        },
        // TARJETA USUARIO
        card: {
            backgroundColor: '#1E293B',
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px',
            position: 'relative' as const,
            overflow: 'hidden'
        },
        userHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        avatar: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#0F172A',
            border: '2px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#94A3B8',
            textTransform: 'uppercase' as const,
            overflow: 'hidden'
        },
        userInfo: {
            flex: 1,
            minWidth: 0
        },
        nameRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '2px'
        },
        name: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px'
        },
        email: {
            color: '#94A3B8',
            fontSize: '12px',
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        roleBadge: {
            fontSize: '9px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: '900',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
            border: '1px solid'
        },
        actionsRow: {
            display: 'flex',
            gap: '8px',
            marginTop: '4px',
            paddingTop: '12px',
            borderTop: '1px solid #334155'
        },
        actionBtn: {
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid',
            backgroundColor: 'transparent',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            textAlign: 'center' as const,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
        }
    };

    const getRoleStyle = (role: string) => {
        if (role === 'SUPER_ADMIN') return { bg: 'rgba(250, 204, 21, 0.1)', color: '#FACC15', border: '#FACC15' }; // Gold
        if (role === 'ADMIN') return { bg: 'rgba(0, 230, 118, 0.1)', color: '#00E676', border: '#00E676' }; // Green
        return { bg: 'transparent', color: '#94A3B8', border: '#475569' }; // Player
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-signal" />
            </div>
        );
    }

    return (
        <div style={STYLES.container}>

            {/* BUSCADOR */}
            <div className="relative mb-4">
                <div className="absolute left-3 top-3 text-slate-400 flex items-center justify-center">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    className="w-full py-3 pl-11 pr-4 bg-[#1E293B] border border-[#334155] rounded-xl text-white outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* LISTA */}
            {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>No se encontraron usuarios.</div>
            ) : (
                filteredUsers.map(user => {
                    const roleStyle = getRoleStyle(user.role);
                    const isBanned = user.status === 'BANNED';

                    return (
                        <div key={user.id} style={STYLES.card}>

                            <div style={STYLES.userHeader}>
                                {/* Avatar */}
                                <div style={{ ...STYLES.avatar, borderColor: roleStyle.border, color: roleStyle.border }}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                        user.fullName.substring(0, 2)
                                    )}
                                </div>

                                <div style={STYLES.userInfo}>
                                    <div style={STYLES.nameRow}>
                                        <span style={STYLES.name}>{user.nickname || user.fullName}</span>
                                        <span style={{
                                            ...STYLES.roleBadge,
                                            backgroundColor: roleStyle.bg,
                                            color: roleStyle.color,
                                            borderColor: roleStyle.border
                                        }}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <div style={STYLES.email}>{user.email}</div>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div style={STYLES.actionsRow}>
                                <button
                                    onClick={() => handleEdit(user)}
                                    style={{ ...STYLES.actionBtn, borderColor: '#475569', color: '#94A3B8' }}
                                >
                                    <Edit3 size={14} /> Editar
                                </button>

                                {isBanned ? (
                                    <button
                                        onClick={() => handleBan(user)}
                                        style={{ ...STYLES.actionBtn, borderColor: '#00E676', color: '#00E676' }}
                                    >
                                        <CheckCircle size={14} /> Activar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleBan(user)}
                                        style={{ ...STYLES.actionBtn, borderColor: '#FF1744', color: '#FF1744' }}
                                    >
                                        <Ban size={14} /> Bloquear
                                    </button>
                                )}

                                <button
                                    onClick={() => handleDelete(user.id)}
                                    style={{ ...STYLES.actionBtn, borderColor: '#EF4444', color: '#EF4444' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                        </div>
                    );
                })
            )}

            {selectedUser && (
                <EditUserDialog
                    user={selectedUser}
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    onUserUpdated={handleUserUpdated}
                />
            )}
        </div>
    );
}
