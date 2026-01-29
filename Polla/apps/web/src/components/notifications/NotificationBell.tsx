"use client";

import React, { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { Bell, CheckCheck, Info, Gift, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppStore } from "@/store/useAppStore";
import api from '@/lib/api';
import { toast } from 'sonner';

// Tipos
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'PROMO';
  isRead: boolean;
  createdAt: string;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

/* =============================================================================
   COMPONENTE: NOTIFICATION BELL
   ============================================================================= */
export function NotificationBell() {
  const { user } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // SWR Polling cada 30 segundos
  const { data: notifications, mutate } = useSWR<Notification[]>(
    user ? '/notifications' : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
        // Optimistic Update
        const updated = notifications?.map(n => ({ ...n, isRead: true }));
        mutate(updated, false); // Update locally without revalidation immediately

        await api.patch('/notifications/read-all');
        mutate(); // Revalidate with server (just in case)
        toast.success("Todo marcado como leído");
    } catch (error) {
        toast.error("Error al actualizar notificaciones");
    }
  };

  // SMART LINKS HELPER
  const renderMessageWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-signal hover:underline break-all font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // SISTEMA DE DISEÑO (Matching UserNav.tsx)
  const STYLES = {
    wrapper: {
      position: 'relative' as const,
      zIndex: 50
    },
    trigger: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: '#1E293B',
      border: `2px solid ${isOpen ? '#00E676' : '#334155'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: isOpen ? '#00E676' : '#94A3B8',
      position: 'relative' as const
    },
    badge: {
        position: 'absolute' as const,
        top: '-5px',
        right: '-5px',
        backgroundColor: '#FF1744',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        height: '18px',
        minWidth: '18px',
        borderRadius: '9px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        border: '2px solid #0F172A'
    },
    dropdown: {
      backgroundColor: '#1E293B', 
      border: '1px solid #334155',
      borderRadius: '12px',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.6)',
      overflow: 'hidden',
      animation: 'fadeIn 0.2s ease-out',
      maxHeight: '400px',
      display: 'flex',
      flexDirection: 'column' as const
    },
    header: {
        padding: '12px',
        borderBottom: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0F172A'
    },
    title: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'white',
        fontFamily: "'Russo One', sans-serif",
    },
    markReadBtn: {
        fontSize: '11px',
        color: '#00E676',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    list: {
        overflowY: 'auto' as const,
        flex: 1
    },
    item: {
        padding: '12px',
        borderBottom: '1px solid #334155',
        display: 'flex',
        gap: '12px',
        transition: 'background 0.2s',
        cursor: 'default',
        backgroundColor: 'transparent'
    },
    itemUnread: {
        backgroundColor: 'rgba(0, 230, 118, 0.05)'
    },
    iconWrapper: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    },
    content: {
        flex: 1
    },
    itemTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: '13px',
        marginBottom: '2px'
    },
    itemMessage: {
        color: '#94A3B8',
        fontSize: '12px',
        lineHeight: '1.4'
    },
    itemTime: {
        marginTop: '4px',
        fontSize: '10px',
        color: '#64748B'
    },
    emptyState: {
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '12px',
        color: '#64748B',
        textAlign: 'center' as const
    }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'SUCCESS': return <CheckCircle size={16} className="text-white" />;
          case 'WARNING': return <AlertTriangle size={16} className="text-black" />;
          case 'PROMO': return <Gift size={16} className="text-black" />;
          default: return <Info size={16} className="text-white" />;
      }
  };

  const getIconBg = (type: string) => {
    switch(type) {
        case 'SUCCESS': return '#10B981'; // Green
        case 'WARNING': return '#F59E0B'; // Amber
        case 'PROMO': return '#FCD34D'; // Yellow
        default: return '#3B82F6'; // Blue
    }
};

  const getTimeAgo = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Hace unos segundos';
      if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
      if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
      return `Hace ${Math.floor(diffInSeconds / 86400)} d`;
  };

  return (
    <div style={STYLES.wrapper} ref={menuRef} className="notification-bell">
      {/* TRIGGER */}
      <div
        style={STYLES.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={18} />
        {unreadCount > 0 && <div style={STYLES.badge}>{unreadCount > 9 ? '9+' : unreadCount}</div>}
      </div>

      {/* POPUP */}
      {isOpen && (
        <div 
            style={STYLES.dropdown}
            className="absolute top-[120%] -right-16 md:right-0 w-[85vw] md:w-[320px] max-w-[320px] z-50"
        >
            <div style={STYLES.header}>
                <span style={STYLES.title}>Notificaciones</span>
                {unreadCount > 0 && (
                    <button style={STYLES.markReadBtn} onClick={handleMarkAllRead}>
                        <CheckCheck size={14} /> Marcar ledías
                    </button>
                )}
            </div>

            <div style={STYLES.list}>
                {(!notifications || notifications.length === 0) ? (
                    <div style={STYLES.emptyState}>
                        <Bell size={32} style={{ opacity: 0.3 }} />
                        <span style={{ fontSize: '13px' }}>Sin notificaciones nuevas</span>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div 
                            key={notification.id} 
                            style={{ 
                                ...STYLES.item, 
                                ...(!notification.isRead ? STYLES.itemUnread : {}) 
                            }}
                        >
                            <div style={{ ...STYLES.iconWrapper, backgroundColor: getIconBg(notification.type) }}>
                                {getIcon(notification.type)}
                            </div>
                            <div style={STYLES.content}>
                                <div style={STYLES.itemTitle}>{notification.title}</div>
                                <div style={STYLES.itemMessage}>
                                    {renderMessageWithLinks(notification.message)}
                                </div>
                                <div style={STYLES.itemTime}>{getTimeAgo(notification.createdAt)}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}
    </div>
  );
}
