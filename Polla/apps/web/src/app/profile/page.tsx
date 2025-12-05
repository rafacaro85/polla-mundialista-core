"use client";

import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Save, Camera, ChevronLeft, CreditCard, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/* =============================================================================
   COMPONENTE: PERFIL DE USUARIO (TACTICAL STYLE)
   ============================================================================= */
export default function ProfilePage() {
  const router = useRouter();
  const { user, mutate } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ESTADO DEL FORMULARIO
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    phone: '',
    email: '',
    avatarUrl: ''
  });

  // CARGAR DATOS DEL USUARIO
  useEffect(() => {
    if (user) {
      // Separar nombre completo en Nombres y Apellidos
      const nameParts = (user.fullName || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName,
        lastName,
        nickname: user.nickname || '',
        phone: user.phoneNumber || '',
        email: user.email || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  // MANEJADOR DE CAMBIOS
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // MANEJADOR DE CAMBIO DE FOTO
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (ej: 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen es muy pesada (máx 2MB)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // GUARDAR
  const handleSave = async () => {
    setLoading(true);
    try {
      // Unir Nombres y Apellidos
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      await api.patch('/users/profile', {
        nickname: formData.nickname,
        fullName,
        phoneNumber: formData.phone,
        avatarUrl: formData.avatarUrl
      });

      toast.success('¡Perfil actualizado correctamente!');
      mutate(); // Revalidar datos del usuario

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  // SISTEMA DE DISEÑO
  const STYLES = {
    container: {
      padding: '16px',
      paddingBottom: '100px',
      backgroundColor: '#0F172A', // Obsidian
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      color: 'white'
    },
    // HEADER CON BOTÓN ATRÁS
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '24px'
    },
    backBtn: {
      background: 'none',
      border: 'none',
      color: '#94A3B8',
      cursor: 'pointer',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    title: {
      flex: 1,
      textAlign: 'center' as const,
      fontFamily: "'Russo One', sans-serif",
      fontSize: '18px',
      textTransform: 'uppercase' as const,
      marginRight: '24px' // Para equilibrar el botón de atrás
    },

    // SECCIÓN AVATAR
    avatarSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginBottom: '32px',
      position: 'relative' as const
    },
    avatarCircle: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      border: '3px solid #00E676', // Borde Neón
      padding: '3px', // Espacio entre borde e imagen
      position: 'relative' as const,
      boxShadow: '0 0 20px rgba(0, 230, 118, 0.3)',
      overflow: 'hidden' // Para recortar la imagen
    },
    avatarImg: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: '#1E293B',
      objectFit: 'cover' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#94A3B8'
    },
    editIconBadge: {
      position: 'absolute' as const,
      bottom: '0',
      right: '0',
      backgroundColor: '#00E676',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#0F172A',
      border: '3px solid #0F172A', // Borde del color del fondo para separar
      cursor: 'pointer',
      zIndex: 10
    },

    // FORMULARIO
    formCard: {
      backgroundColor: '#1E293B', // Carbon
      borderRadius: '16px',
      border: '1px solid #334155',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    label: {
      fontSize: '11px',
      color: '#94A3B8',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      marginLeft: '4px'
    },
    inputWrapper: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center'
    },
    icon: {
      position: 'absolute' as const,
      left: '16px',
      color: '#64748B'
    },
    input: {
      width: '100%',
      backgroundColor: '#0F172A',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '14px 16px 14px 44px', // Padding izq para el icono
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    // Botón Guardar
    saveBtn: {
      marginTop: '12px',
      backgroundColor: '#00E676',
      color: '#0F172A',
      border: 'none',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: '900',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)'
    },
    disabledInput: {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  };

  return (
    <div style={STYLES.container}>

      {/* 1. HEADER */}
      <div style={STYLES.header}>
        <button onClick={() => router.back()} style={STYLES.backBtn}>
          <ChevronLeft size={20} /> Regresar
        </button>
        <h1 style={STYLES.title}>Mi Perfil</h1>
        <div style={{ width: '32px' }}></div> {/* Espaciador para centrar título */}
      </div>

      {/* 2. AVATAR */}
      <div style={STYLES.avatarSection}>
        <div style={STYLES.avatarCircle}>
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            <div style={STYLES.avatarImg}>
              {formData.firstName ? formData.firstName.substring(0, 1) : ''}
              {formData.lastName ? formData.lastName.substring(0, 1) : ''}
            </div>
          )}

          {/* Botón flotante de cámara */}
          <div style={STYLES.editIconBadge} onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} strokeWidth={2.5} />
          </div>
        </div>
        <p style={{ marginTop: '12px', fontSize: '12px', color: '#94A3B8' }}>Toca la cámara para cambiar foto</p>

        {/* Input oculto para archivo */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="image/*"
        />
      </div>

      {/* 3. FORMULARIO */}
      <div style={STYLES.formCard}>

        {/* APODO (ALIAS) */}
        <div style={STYLES.inputGroup}>
          <label style={STYLES.label}>Tu Apodo (Alias)</label>
          <div style={STYLES.inputWrapper}>
            <User size={18} style={{ ...STYLES.icon, color: '#00E676' }} /> {/* Icono verde para resaltar */}
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              style={{ ...STYLES.input, borderColor: '#00E676', backgroundColor: 'rgba(0, 230, 118, 0.05)' }} // Input destacado
              placeholder="Cómo te dicen tus amigos"
            />
          </div>
        </div>

        {/* NOMBRE Y APELLIDO (Grid de 2 columnas) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={STYLES.inputGroup}>
            <label style={STYLES.label}>Nombres</label>
            <div style={STYLES.inputWrapper}>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                style={{ ...STYLES.input, paddingLeft: '16px' }} // Sin icono
              />
            </div>
          </div>
          <div style={STYLES.inputGroup}>
            <label style={STYLES.label}>Apellidos</label>
            <div style={STYLES.inputWrapper}>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                style={{ ...STYLES.input, paddingLeft: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* CELULAR */}
        <div style={STYLES.inputGroup}>
          <label style={STYLES.label}>Celular / WhatsApp</label>
          <div style={STYLES.inputWrapper}>
            <Phone size={18} style={STYLES.icon} />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={STYLES.input}
              placeholder="+57 300 000 0000"
            />
          </div>
        </div>

        {/* CORREO (Solo lectura) */}
        <div style={STYLES.inputGroup}>
          <label style={STYLES.label}>Correo Electrónico</label>
          <div style={STYLES.inputWrapper}>
            <Mail size={18} style={STYLES.icon} />
            <input
              type="email"
              value={formData.email}
              readOnly
              style={{ ...STYLES.input, ...STYLES.disabledInput }}
            />
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <button
          onClick={handleSave}
          style={STYLES.saveBtn}
          disabled={loading}
        >
          {loading ? 'Guardando...' : (
            <>
              <Save size={18} /> Guardar Cambios
            </>
          )}
        </button>

      </div>

    </div>
  );
};