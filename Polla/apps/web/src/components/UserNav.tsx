"use client";

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, ChevronRight, Shield, LayoutGrid, HelpCircle, ChevronDown } from 'lucide-react';
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

/* =============================================================================
   COMPONENTE: USER MENU (DROPDOWN TACTICAL)
   ============================================================================= */
export function UserNav() {
  const { user, isLoading, logout, selectedLeagueId } = useAppStore();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (isLoading) {
    return <div className="w-9 h-9 rounded-full bg-slate-800 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="ghost" className="text-white hover:text-signal">Ingresar</Button>
      </Link>
    );
  }

  // Datos del usuario mapeados
  const userData = {
    name: user.nickname || user.fullName,
    email: user.email,
    avatar: user.avatarUrl || user.picture,
    role: user.role
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleAdmin = () => {
    router.push('/admin');
  };

  const handleSuperAdmin = () => {
    router.push('/super-admin');
  };

  const isAdmin = userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN';

  // SISTEMA DE DISEÑO
  const STYLES = {
    // Contenedor Relativo para el Dropdown
    wrapper: {
      position: 'relative' as const,
      zIndex: 50
    },
    // Contenedor que agrupa Avatar + Flecha
    triggerContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '20px',
      transition: 'all 0.2s ease',
    },
    // Botón Trigger (Avatar en el Header)
    avatarTrigger: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: '#1E293B',
      border: `2px solid ${isOpen ? '#00E676' : '#334155'}`, // Borde verde si está abierto
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      boxShadow: isOpen ? '0 0 10px rgba(0, 230, 118, 0.3)' : 'none'
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const
    },
    fallbackInitial: {
      color: '#94A3B8',
      fontWeight: 'bold',
      fontSize: '14px'
    },
    chevronDown: {
      color: isOpen ? '#00E676' : '#94A3B8',
      transition: 'all 0.2s ease',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
    },

    // MENÚ DESPLEGABLE
    dropdown: {
      position: 'absolute' as const,
      top: '120%', // Un poco separado del avatar
      right: 0,
      width: '240px',
      backgroundColor: '#1E293B', // Carbon sólido
      border: '1px solid #334155',
      borderRadius: '12px',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.6)',
      padding: '8px',
      overflow: 'hidden',
      animation: 'fadeIn 0.2s ease-out'
    },
    // Cabecera del Menú (Info Usuario)
    menuHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      borderBottom: '1px solid #334155',
      marginBottom: '4px'
    },
    headerAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#0F172A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #475569',
      flexShrink: 0
    },
    userInfo: {
      overflow: 'hidden'
    },
    userName: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: '14px',
      fontFamily: "'Russo One', sans-serif",
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    userEmail: {
      color: '#94A3B8',
      fontSize: '11px',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    // Elementos de Lista
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      borderRadius: '8px',
      color: '#F8FAFC',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.2s',
      border: 'none',
      background: 'transparent',
      width: '100%',
      textAlign: 'left' as const
    },
    menuItemHover: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    },
    icon: {
      color: '#00E676', // Iconos verdes
      width: '16px',
      height: '16px'
    },
    chevron: {
      marginLeft: 'auto',
      color: '#475569',
      width: '14px',
      height: '14px'
    },

    // Separador
    divider: {
      height: '1px',
      backgroundColor: '#334155',
      margin: '4px 0'
    },

    // Item Peligroso (Logout)
    logoutItem: {
      color: '#FF1744' // Rojo Neón
    }
  };

  // Helper para hover (React inline styles son limitados para hover, usaremos onMouseEnter)
  const MenuItem = ({ icon: Icon, label, onClick, isDanger = false, isSpecial = false, hasArrow = false }: any) => {
    const [hover, setHover] = useState(false);
    return (
      <button
        onClick={() => {
          setIsOpen(false);
          onClick();
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          ...STYLES.menuItem,
          ...(hover ? STYLES.menuItemHover : {}),
          ...(isDanger ? STYLES.logoutItem : {}),
          ...(isSpecial ? { border: '1px solid #00E676', backgroundColor: 'rgba(0, 230, 118, 0.1)', color: '#00E676', fontWeight: 'bold' } : {})
        }}
      >
        <Icon style={{ ...STYLES.icon, color: isDanger ? '#FF1744' : (isSpecial ? '#00E676' : '#00E676') }} />
        {label}
        {hasArrow && <ChevronRight style={STYLES.chevron} />}
      </button>
    );
  };

  return (
    <div style={STYLES.wrapper} ref={menuRef}>

      {/* TRIGGER (AVATAR HEADER + FLECHA) */}
      <div 
        style={STYLES.triggerContainer}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={STYLES.avatarTrigger}>
          {userData.avatar ? (
            <img src={userData.avatar} alt="User" style={STYLES.avatarImage} />
          ) : (
            <span style={STYLES.fallbackInitial}>{userData.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <ChevronDown size={14} style={STYLES.chevronDown} />
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div style={STYLES.dropdown}>

          {/* Header del Menú */}
          <div style={STYLES.menuHeader}>
            <div style={STYLES.headerAvatar}>
              {userData.avatar ? (
                <img src={userData.avatar} alt="User" style={{ ...STYLES.avatarImage, borderRadius: '50%' }} />
              ) : (
                <span style={{ color: 'white', fontWeight: 'bold' }}>{userData.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div style={STYLES.userInfo}>
              <div style={STYLES.userName}>{userData.name}</div>
              <div style={STYLES.userEmail}>{userData.email}</div>
            </div>
          </div>

          {/* Opciones */}
          <MenuItem
            icon={User}
            label="Mi Perfil"
            onClick={handleProfile}
            hasArrow
          />

          {selectedLeagueId && selectedLeagueId !== 'global' ? (
            <>
              <MenuItem
                icon={Settings}
                label="Administrar Polla"
                onClick={() => router.push(`/leagues/${selectedLeagueId}/admin`)}
                hasArrow
                isSpecial
              />
            </>
          ) : (
            <></>
          )}

          {isAdmin && (
            <MenuItem
              icon={Shield}
              label="Super Admin"
              onClick={handleSuperAdmin}
              isSpecial
              hasArrow
            />
          )}

          <div style={STYLES.divider} />

          <MenuItem
            icon={HelpCircle}
            label="Cómo Jugar"
            onClick={() => router.push('/instructions')}
            hasArrow
          />

          <div style={STYLES.divider} />

          <MenuItem
            icon={LogOut}
            label="Cerrar Sesión"
            onClick={logout}
            isDanger
          />

        </div>
      )}
    </div>
  );
}