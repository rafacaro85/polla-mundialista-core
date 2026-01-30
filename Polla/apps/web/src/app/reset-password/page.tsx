"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

/* =============================================================================
   COMPONENTE: PANTALLA DE RESTABLECIMIENTO DE CONTRASEÑA
   ============================================================================= */
const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      toast.error('Token de recuperación no válido o inexistente');
      router.push('/login');
    }
  }, [token, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResetAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      });

      toast.success('¡Contraseña restablecida exitosamente!');
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: any) {
      console.error('Reset Password Error:', error);
      const msg = error.response?.data?.message || 'Error al restablecer contraseña';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const STYLES = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0F172A',
      padding: '20px',
      position: 'relative' as const,
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    },
    backgroundGlow: {
      position: 'absolute' as const,
      top: '-20%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '120%',
      height: '60%',
      background: 'radial-gradient(circle, rgba(0, 230, 118, 0.15) 0%, rgba(15, 23, 42, 0) 70%)',
      pointerEvents: 'none' as const,
      zIndex: 0
    },
    logoBox: {
      marginBottom: '32px',
      textAlign: 'center' as const,
      zIndex: 10
    },
    logoTitle: {
      fontFamily: "'Russo One', sans-serif",
      fontSize: '32px',
      color: 'white',
      textTransform: 'uppercase' as const,
      lineHeight: '1',
      letterSpacing: '-1px'
    },
    logoSubtitle: {
      fontSize: '10px',
      color: '#94A3B8',
      fontWeight: 'bold',
      letterSpacing: '4px',
      marginTop: '8px'
    },
    card: {
      width: '100%',
      maxWidth: '420px',
      backgroundColor: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      padding: '32px 28px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      zIndex: 10,
      position: 'relative' as const
    },
    headerText: {
      color: 'white',
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '8px',
      textAlign: 'center' as const
    },
    subHeaderText: {
      color: '#94A3B8',
      fontSize: '13px',
      marginBottom: '24px',
      textAlign: 'center' as const
    },
    inputGroup: {
      position: 'relative' as const,
      marginBottom: '16px',
      width: '100%'
    },
    inputIcon: {
      position: 'absolute' as const,
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#94A3B8'
    },
    input: {
      width: '100%',
      padding: '14px 16px 14px 48px',
      backgroundColor: '#0F172A',
      border: '1px solid #334155',
      borderRadius: '12px',
      color: 'white',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box' as const
    },
    primaryBtn: {
      width: '100%',
      padding: '14px',
      backgroundColor: '#00E676',
      color: '#0F172A',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '900',
      textTransform: 'uppercase' as const,
      cursor: 'pointer',
      marginTop: '8px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 0 20px rgba(0, 230, 118, 0.3)',
      transition: 'transform 0.2s',
      boxSizing: 'border-box' as const
    }
  };

  if (success) {
    return (
      <div style={STYLES.container}>
        <div style={STYLES.backgroundGlow} />
        <div style={STYLES.card}>
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={64} color="#00E676" style={{ margin: '0 auto 24px' }} />
            <h2 style={STYLES.headerText}>¡Éxito!</h2>
            <p style={STYLES.subHeaderText}>
              Tu contraseña ha sido restablecida. Serás redirigido al inicio de sesión en unos segundos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={STYLES.container}>
      <div style={STYLES.backgroundGlow} />

      <div style={STYLES.logoBox}>
        <h1 style={STYLES.logoTitle}>
          POLLA <span style={{ color: '#00E676' }}>MUNDIALISTA</span>
        </h1>
        <p style={STYLES.logoSubtitle}>FIFA WORLD CUP 2026</p>
      </div>

      <div style={STYLES.card}>
        <h2 style={STYLES.headerText}>Nueva Contraseña</h2>
        <p style={STYLES.subHeaderText}>Ingresa tu nueva contraseña para recuperar el acceso.</p>

        <form onSubmit={handleResetAction}>
          <div style={STYLES.inputGroup}>
            <Lock size={20} style={STYLES.inputIcon} />
            <input
              type={showPassword ? "text" : "password"}
              name="newPassword"
              placeholder="Nueva Contraseña"
              required
              style={{ ...STYLES.input, paddingRight: '48px' }}
              value={formData.newPassword}
              onChange={handleChange}
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          <div style={STYLES.inputGroup}>
            <Lock size={20} style={STYLES.inputIcon} />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirmar Nueva Contraseña"
              required
              style={{ ...STYLES.input, paddingRight: '48px' }}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button type="submit" style={STYLES.primaryBtn} disabled={loading}>
            {loading ? 'Procesando...' : (
              <>
                Restablecer Contraseña
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
