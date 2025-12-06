"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Chrome, Eye, EyeOff, AlertCircle, CheckCircle, Phone } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

/* =============================================================================
   COMPONENTE: PANTALLA DE ACCESO (LOGIN / REGISTER / FORGOT / VERIFY)
   ============================================================================= */
export const LoginScreen = ({ onGoogleLogin }: { onGoogleLogin: () => void }) => {
  const router = useRouter();

  // ESTADOS DE LA VISTA
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ESTADOS DEL FORMULARIO
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    phoneNumber: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // AUTH ACTION HANDLER
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'login') {
        // LOGIN FLOW
        const { data } = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });

        // Guardar token y usuario
        localStorage.setItem('token', data.access_token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        toast.success('¡Bienvenido de nuevo!');
        window.location.href = '/'; // Recargar para limpiar estados y actualizar auth

      } else if (view === 'register') {
        // REGISTER FLOW
        if (formData.password !== formData.confirmPassword) {
          toast.error('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber
        });

        toast.success('Cuenta creada. Revisa tu correo (o consola) para el código de verificación.');
        setView('verify');

      } else if (view === 'verify') {
        // VERIFY FLOW
        const { data } = await api.post('/auth/verify', {
          email: formData.email,
          code: formData.verificationCode
        });

        // Auto-login after verification
        localStorage.setItem('token', data.access_token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        toast.success('¡Cuenta verificada exitosamente!');
        window.location.href = '/';

      } else if (view === 'forgot') {
        // FORGOT PASSWORD FLOW
        await api.post('/auth/forgot-password', {
          email: formData.email
        });

        toast.success('Si el correo existe, te hemos enviado instrucciones.');
        setView('login');
      }
    } catch (error: any) {
      console.error('Auth Error:', error);

      let msg = 'Ocurrió un error inesperado';

      if (error.response) {
        if (error.response.status === 409) {
          msg = 'Este correo ya está registrado. Intenta iniciar sesión.';
        } else if (error.response.status === 404) {
          msg = 'Este correo no está registrado.';
          toast.error(msg, {
            action: {
              label: 'Registrarme',
              onClick: () => setView('register')
            }
          });
          return;
        } else if (error.response.data?.message) {
          const rawMsg = error.response.data.message;
          msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
        }
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // SISTEMA DE DISEÑO (BLINDADO)
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
    // FONDO CON EFECTO
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
    // LOGO
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
    // TARJETA DE FORMULARIO
    card: {
      width: '100%',
      maxWidth: '420px',
      backgroundColor: 'rgba(30, 41, 59, 0.7)', // Carbon transparente
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
    // INPUTS
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
    // BOTÓN PRIMARIO (NEON)
    primaryBtn: {
      width: '100%',
      padding: '14px',
      backgroundColor: '#00E676', // Signal Green
      color: '#0F172A',           // Obsidian Text
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
    },
    // BOTÓN GOOGLE
    googleBtn: {
      width: '100%',
      padding: '12px',
      backgroundColor: 'white',
      color: '#0F172A',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '24px',
      boxSizing: 'border-box' as const
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      color: '#64748B',
      fontSize: '11px',
      fontWeight: 'bold',
      margin: '24px 0',
      textTransform: 'uppercase' as const
    },
    line: {
      flex: 1,
      height: '1px',
      backgroundColor: '#334155'
    },
    // LINKS
    linkBtn: {
      background: 'none',
      border: 'none',
      color: '#00E676',
      fontWeight: 'bold',
      fontSize: '12px',
      cursor: 'pointer',
      textDecoration: 'none'
    }
  };

  return (
    <div style={STYLES.container}>

      {/* Fondo decorativo */}
      <div style={STYLES.backgroundGlow} />

      {/* LOGO */}
      <div style={STYLES.logoBox}>
        <h1 style={STYLES.logoTitle}>
          POLLA <span style={{ color: '#00E676' }}>MUNDIALISTA</span>
        </h1>
        <p style={STYLES.logoSubtitle}>FIFA WORLD CUP 2026</p>
      </div>

      {/* TARJETA FORMULARIO */}
      <div style={STYLES.card}>

        {/* Header dinámico según la vista */}
        <h2 style={STYLES.headerText}>
          {view === 'login' && 'Bienvenido de nuevo'}
          {view === 'register' && 'Crea tu cuenta'}
          {view === 'forgot' && 'Recuperar acceso'}
          {view === 'verify' && 'Verificar Cuenta'}
        </h2>
        <p style={STYLES.subHeaderText}>
          {view === 'login' && 'Ingresa tus credenciales para continuar'}
          {view === 'register' && 'Únete al torneo y compite con amigos'}
          {view === 'forgot' && 'Te enviaremos un link a tu correo'}
          {view === 'verify' && `Ingresa el código enviado a ${formData.email}`}
        </p>

        {/* Si NO es recuperar contraseña NI verificar, mostramos botón Google */}
        {view !== 'forgot' && view !== 'verify' && (
          <>
            <button style={STYLES.googleBtn} onClick={onGoogleLogin}>
              <Chrome size={20} color="#EA4335" />
              Continuar con Google
            </button>

            <div style={STYLES.divider}>
              <div style={STYLES.line} />
              <span style={{ margin: '0 10px' }}>O usa tu correo</span>
              <div style={STYLES.line} />
            </div>
          </>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleAuthAction}>

          {/* Nombre (Solo en Registro) */}
          {view === 'register' && (
            <div style={STYLES.inputGroup}>
              <User size={20} style={STYLES.inputIcon} />
              <input
                type="text"
                name="name"
                placeholder="Nombre completo"
                required
                style={STYLES.input}
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Email (Siempre excepto Verify si ya lo tenemos, pero mejor mostrarlo disabled o pedirlo de nuevo) */}
          {/* En este flujo, mantenemos el email en el estado, así que lo mostramos disabled en verify para contexto */}
          <div style={STYLES.inputGroup}>
            <Mail size={20} style={STYLES.inputIcon} />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              required
              disabled={view === 'verify'}
              style={{ ...STYLES.input, opacity: view === 'verify' ? 0.7 : 1 }}
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Teléfono (Solo en Registro) */}
          {view === 'register' && (
            <div style={STYLES.inputGroup}>
              <Phone size={20} style={STYLES.inputIcon} />
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Teléfono (Opcional para SMS)"
                style={STYLES.input}
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Contraseña (Solo Login y Register) */}
          {(view === 'login' || view === 'register') && (
            <div style={STYLES.inputGroup}>
              <Lock size={20} style={STYLES.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                required
                style={{ ...STYLES.input, paddingRight: '48px' }}
                value={formData.password}
                onChange={handleChange}
              />
              <div
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          )}

          {/* Confirmar Contraseña (Solo en Register) */}
          {view === 'register' && (
            <div style={STYLES.inputGroup}>
              <Lock size={20} style={STYLES.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirmar Contraseña"
                required
                style={{ ...STYLES.input, paddingRight: '48px' }}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Código de Verificación (Solo en Verify) */}
          {view === 'verify' && (
            <div style={STYLES.inputGroup}>
              <CheckCircle size={20} style={STYLES.inputIcon} />
              <input
                type="text"
                name="verificationCode"
                placeholder="Código de 6 dígitos"
                required
                maxLength={6}
                style={{ ...STYLES.input, letterSpacing: '4px', textAlign: 'center', fontSize: '18px' }}
                value={formData.verificationCode}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Link Olvidé Contraseña (Solo en Login) */}
          {view === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setView('forgot')}
                style={{ ...STYLES.linkBtn, color: '#94A3B8', fontSize: '11px' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Botón Acción Principal */}
          <button type="submit" style={STYLES.primaryBtn} disabled={loading}>
            {loading ? 'Procesando...' : (
              <>
                {view === 'login' && 'Iniciar Sesión'}
                {view === 'register' && 'Crear Cuenta'}
                {view === 'forgot' && 'Enviar Link'}
                {view === 'verify' && 'Verificar Cuenta'}
                {!loading && <ArrowRight size={18} />}
              </>
            )}
          </button>

        </form>

        {/* Footer Switch (Login <-> Register) */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#94A3B8' }}>
          {view === 'login' && (
            <>
              ¿No tienes cuenta?{' '}
              <button onClick={() => setView('register')} style={STYLES.linkBtn}>Regístrate</button>
            </>
          )}
          {view === 'register' && (
            <>
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => setView('login')} style={STYLES.linkBtn}>Inicia Sesión</button>
            </>
          )}
          {view === 'forgot' && (
            <button onClick={() => setView('login')} style={STYLES.linkBtn}>
              Volver al inicio
            </button>
          )}
          {view === 'verify' && (
            <button onClick={() => setView('login')} style={STYLES.linkBtn}>
              Cancelar
            </button>
          )}
        </div>

      </div>

      {/* Legal Footer */}
      <div style={{ position: 'absolute', bottom: '20px', fontSize: '10px', color: '#475569', textAlign: 'center', width: '100%' }}>
        Al continuar, aceptas nuestros Términos y Política de Privacidad.
      </div>

    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir si el usuario ya está logueado (opcional, si hay un token válido)
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      router.push('/');
    }
  }, [router]);

  const handleGoogleLogin = () => {
    // Limpiar completamente el localStorage y sessionStorage antes de iniciar sesión
    localStorage.clear();
    sessionStorage.clear();

    // Agregar timestamp para forzar nueva autenticación
    const timestamp = Date.now();
    window.location.href = `/auth/google?t=${timestamp}`;
  };

  return <LoginScreen onGoogleLogin={handleGoogleLogin} />;
}
