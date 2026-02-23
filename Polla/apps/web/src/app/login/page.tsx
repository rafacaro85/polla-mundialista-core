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

  // ESTADOS DE LA VISTA
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    if (!acceptedTerms) {
      toast.error('Debes aceptar los Términos y Condiciones para continuar');
      return;
    }
    setLoading(true);

    const getRedirectPath = () => {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl');
      if (callbackUrl) return callbackUrl;

      const cookieValue = (name: string) => {
        const val = `; ${document.cookie}`;
        const parts = val.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const inviteCode = cookieValue('pendingInviteCode') || localStorage.getItem('pendingInviteCode');
      if (inviteCode) return `/invite/${inviteCode}`;

      return '/gateway';
    };

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

        window.location.href = getRedirectPath();

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
        window.location.href = getRedirectPath();

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
            <style>{`
              .gsi-material-button {
                -moz-user-select: none;
                -webkit-user-select: none;
                -ms-user-select: none;
                -webkit-appearance: none;
                background-color: WHITE;
                background-image: none;
                border: 1px solid #747775;
                -webkit-border-radius: 20px !important;
                border-radius: 20px !important;
                -webkit-box-sizing: border-box;
                box-sizing: border-box;
                color: #1f1f1f;
                cursor: pointer;
                font-family: 'Roboto', arial, sans-serif;
                font-size: 14px;
                height: 44px;
                letter-spacing: 0.25px;
                outline: none;
                overflow: hidden;
                padding: 0 12px;
                position: relative;
                text-align: center;
                -webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
                transition: background-color .218s, border-color .218s, box-shadow .218s;
                vertical-align: middle;
                white-space: nowrap;
                width: 100%;
                max-width: 400px;
                min-width: min-content;
                margin-bottom: 24px;
              }

              .gsi-material-button .gsi-material-button-icon {
                height: 20px;
                margin-right: 10px;
                min-width: 20px;
                width: 20px;
              }

              .gsi-material-button .gsi-material-button-content-wrapper {
                -webkit-align-items: center;
                align-items: center;
                display: flex;
                -webkit-flex-direction: row;
                flex-direction: row;
                -webkit-flex-wrap: nowrap;
                flex-wrap: nowrap;
                height: 100%;
                justify-content: center;
                position: relative;
                width: 100%;
              }

              .gsi-material-button .gsi-material-button-contents {
                -webkit-flex-grow: 0;
                flex-grow: 0;
                font-family: 'Roboto', arial, sans-serif;
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                vertical-align: top;
              }

              .gsi-material-button .gsi-material-button-state {
                -webkit-transition: opacity .218s;
                transition: opacity .218s;
                bottom: 0;
                left: 0;
                opacity: 0;
                position: absolute;
                right: 0;
                top: 0;
              }

              .gsi-material-button:disabled {
                cursor: default;
                background-color: #ffffff61;
                border-color: #1f1f1f1f;
              }

              .gsi-material-button:disabled .gsi-material-button-contents {
                opacity: 38%;
              }

              .gsi-material-button:disabled .gsi-material-button-icon {
                opacity: 38%;
              }

              .gsi-material-button:not(:disabled):active .gsi-material-button-state, 
              .gsi-material-button:not(:disabled):focus .gsi-material-button-state {
                background-color: #303030;
                opacity: 12%;
              }

              .gsi-material-button:not(:disabled):hover {
                -webkit-box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
                box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
              }

              .gsi-material-button:not(:disabled):hover .gsi-material-button-state {
                background-color: #303030;
                opacity: 8%;
              }
            `}</style>
            
            <button 
              className="gsi-material-button"
              style={{ opacity: acceptedTerms ? 1 : 0.6 }} 
              onClick={() => {
                if (!acceptedTerms) {
                   toast.error('Debes aceptar los Términos y Condiciones para continuar');
                   return;
                }
                onGoogleLogin();
              }}
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{display: 'block'}}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">Continuar con Google</span>
                <span style={{display: 'none'}}>Continuar con Google</span>
              </div>
            </button>

            {/* CHECKBOX LEGAL */}
            <div className="flex items-center gap-2 mb-6 px-1">
              <input 
                type="checkbox" 
                id="legal-checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="legal-checkbox" className="text-xs text-slate-400 cursor-pointer leading-tight select-none">
                Acepto los <a href="/terminos" target="_blank" className="text-emerald-500 hover:underline">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" className="text-emerald-500 hover:underline">Política de Privacidad</a>
              </label>
            </div>

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
          <button 
            type="submit" 
            style={{ ...STYLES.primaryBtn, opacity: (loading || !acceptedTerms) ? 0.7 : 1 }} 
            disabled={loading || !acceptedTerms}
          >
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

  // DESHABILITADO: Permitir que usuarios vean la página de login incluso si tienen token
  // Esto permite re-autenticación o cambio de cuenta
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && localStorage.getItem('token')) {
  //     router.push('/');
  //   }
  // }, [router]);

  const handleGoogleLogin = () => {
    // Limpiar completamente el localStorage y sessionStorage antes de iniciar sesión
    // EXCEPTO el pendingInviteCode que es vital para la redirección post-login
    const invite = localStorage.getItem('pendingInviteCode');
    localStorage.clear();
    sessionStorage.clear();
    if (invite) localStorage.setItem('pendingInviteCode', invite);

    // Usar la función signInWithGoogle que tiene la URL correcta del backend
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get('callbackUrl');
    signInWithGoogle(callbackUrl);
  };

  return <LoginScreen onGoogleLogin={handleGoogleLogin} />;
}
