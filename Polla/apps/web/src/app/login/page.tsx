"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Chrome, Eye, EyeOff, AlertCircle, CheckCircle, Phone } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { signInWithGoogle } from '@/lib/auth.utils';

/* =============================================================================
   COMPONENTE: PANTALLA DE ACCESO (LOGIN / REGISTER / FORGOT / VERIFY)
   ============================================================================= */
export const LoginScreen = ({ onGoogleLogin }: { onGoogleLogin: () => void }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    accessCode: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.accessCode.trim()) {
        toast.error('Completa todos los campos');
        return;
    }

    setLoading(true);

    try {
        const { data } = await api.post('/auth/login-company', {
            fullName: formData.fullName,
            accessCode: formData.accessCode
        });

        // Guardar token y usuario
        localStorage.setItem('token', data.access_token);
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        toast.success(`¡Bienvenido, ${data.user.fullName}!`);
        window.location.href = '/dashboard';

    } catch (error: any) {
        console.error('Login Error:', error);
        toast.error(error.response?.data?.message || 'Código de acceso inválido');
    } finally {
        setLoading(false);
    }
  };

  // SISTEMA DE DISEÑO (PTWP BRANDING)
  const STYLES = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0F172A', // Fallback color
      backgroundImage: `url(${process.env.NEXT_PUBLIC_HERO_IMAGE || 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2831&auto=format&fit=crop'})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '20px',
      position: 'relative' as const,
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    },
    overlay: {
        position: 'absolute' as const,
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // Dark overlay
        zIndex: 1
    },
    content: {
        position: 'relative' as const,
        zIndex: 10,
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center'
    },
    // LOGO
    logoBox: {
      marginBottom: '32px',
      textAlign: 'center' as const,
    },
    companyLogo: {
        maxHeight: '80px',
        marginBottom: '16px',
        filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
    },
    // TARJETA DE FORMULARIO
    card: {
      width: '100%',
      maxWidth: '400px',
      backgroundColor: 'rgba(30, 41, 59, 0.95)', 
      backdropFilter: 'blur(12px)',
      border: `1px solid ${process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#00E676'}40`, // Transparent border
      borderRadius: '24px',
      padding: '40px 32px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px'
    },
    headerText: {
      color: 'white',
      fontSize: '24px',
      fontWeight: '900',
      textAlign: 'center' as const,
      fontFamily: "'Russo One', sans-serif",
      textTransform: 'uppercase' as const,
      marginBottom: '4px'
    },
    subHeaderText: {
      color: '#94A3B8',
      fontSize: '13px',
      textAlign: 'center' as const,
      marginBottom: '10px'
    },
    // INPUTS
    inputGroup: {
      position: 'relative' as const,
      width: '100%'
    },
    label: {
        color: '#94A3B8',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const,
        marginBottom: '8px',
        display: 'block',
        marginLeft: '4px'
    },
    input: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#0F172A',
      border: '1px solid #334155',
      borderRadius: '12px',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'bold',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box' as const
    },
    // BOTÓN PRIMARIO
    primaryBtn: {
      width: '100%',
      padding: '16px',
      backgroundColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#00E676',
      color: '#0F172A',           
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '900',
      textTransform: 'uppercase' as const,
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      boxShadow: `0 0 20px ${process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#00E676'}40`,
      transition: 'transform 0.2s',
      marginTop: '8px'
    }
  };

  return (
    <div style={STYLES.container}>
        <div style={STYLES.overlay} />
        
        <div style={STYLES.content}>
            {/* BRANDING */}
            <div style={STYLES.logoBox}>
                {process.env.NEXT_PUBLIC_COMPANY_LOGO ? (
                    <img src={process.env.NEXT_PUBLIC_COMPANY_LOGO} alt="Company Logo" style={STYLES.companyLogo} />
                ) : (
                    <h1 style={{ fontFamily: "'Russo One', sans-serif", fontSize: '32px', color: 'white', textTransform: 'uppercase' }}>
                        POLLA <span style={{ color: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#00E676' }}>MUNDIALISTA</span>
                    </h1>
                )}
            </div>

            <div style={STYLES.card}>
                <div>
                    <h2 style={STYLES.headerText}>Acceso Corporativo</h2>
                    <p style={STYLES.subHeaderText}>Ingresa tus datos para acceder a la plataforma</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Nombre Completo</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Ej. Juan Pérez"
                            style={STYLES.input}
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Código de Acceso</label>
                        <input
                            type="text" // Text to avoid number spinners, codes can be alphanumeric
                            name="accessCode"
                            placeholder="CÓDIGO EMPRESA"
                            style={{ ...STYLES.input, letterSpacing: '2px', textAlign: 'center' }}
                            value={formData.accessCode}
                            onChange={(e) => setFormData({...formData, accessCode: e.target.value.toUpperCase()})}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        style={{ ...STYLES.primaryBtn, opacity: loading ? 0.7 : 1 }} 
                        disabled={loading}
                    >
                        {loading ? 'Validando...' : (
                            <>
                                INGRESAR <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#64748B' }}>
                        Al ingresar aceptas los términos y condiciones de la actividad.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();

  // DESHABILITADO: Permitir que usuarios vean la página de login incluso si tienen token
  // Esto permite re-autenticación o cambio de cuenta
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && localStorage.getItem('token')) {
  //     router.push('/');
  //   }
  // }, [router]);

  const handleGoogleLogin = () => {
    // Limpiar completamente el localStorage y sessionStorage antes de iniciar sesión
    localStorage.clear();
    sessionStorage.clear();

    // Usar la función signInWithGoogle que tiene la URL correcta del backend
    signInWithGoogle();
  };

  return <LoginScreen onGoogleLogin={handleGoogleLogin} />;
}
