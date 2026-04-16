'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';

export default function MatchLoginPage() {
  const router = useRouter();
  const params = useParams();
  const matchCode = params.matchCode as string;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTableNumbers, setShowTableNumbers] = useState<boolean>(true);
  const [leagueLoading, setLeagueLoading] = useState(true);

  // Fetch league info to get matchEventType
  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const { data } = await api.get(`/leagues/match-code/${matchCode}`);
        setShowTableNumbers(data.showTableNumbers !== undefined ? data.showTableNumbers : true);
      } catch (e) {
        console.error('Error fetching league info', e);
      } finally {
        setLeagueLoading(false);
      }
    };
    fetchLeague();
  }, [matchCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || (showTableNumbers && !tableNumber)) {
      toast.error('Por favor completa todos los campos.');
      return;
    }

    if (phone.length < 10) {
      toast.error('El celular debe tener 10 dígitos.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/match-login', { name, phone, tableNumber: showTableNumbers ? tableNumber : 'N/A', matchCode });
      // If using localStorage for cross-domain auth
      if (res.data.access_token) {
        localStorage.setItem('auth_token', res.data.access_token);
      }
      
      // IMPORTANT: Update Zustand store immediately
      if (res.data.user) {
        useAppStore.getState().setUser(res.data.user);
      }

      toast.success('¡Bienvenido a la Polla Match!');
      // Force reload to update auth context correctly
      // Delay it just a bit to ensure storage sets correctly across renders/hooks
      setTimeout(() => {
        window.location.href = `/match/${matchCode}/play`;
      }, 100);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al ingresar. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (leagueLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 mb-6">
            <Image
              src="/assets/logo.png"
              alt="La Polla Virtual"
              width={96}
              height={96}
              className="object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            />
          </div>

          <h1 className="text-3xl font-black text-white text-center mb-2 italic uppercase tracking-wider">
            ¡ENTRA AL JUEGO! <span className="text-emerald-500">⚽</span>
          </h1>
          <p className="text-slate-400 text-center mb-8 text-sm">
            {showTableNumbers ? 'Un partido. Un QR. Toda la emoción.' : 'Demuestra quién sabe más de fútbol.'}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                👤 Tu Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium placeholder-slate-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                📱 Tu Teléfono (Identificación Única)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Ej. 3001234567"
                pattern="[0-9]{10}"
                title="Debe ser un número de 10 dígitos"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium placeholder-slate-700"
                required
              />
              <p className="text-[10px] text-emerald-400/80 mt-1 pl-1">
                * Este número es tu llave única en el juego.
              </p>
            </div>

            {showTableNumbers && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  🪑 Número de Mesa
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ej. Mesa 4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium placeholder-slate-700"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black rounded-xl px-4 py-4 mt-6 transform transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-base"
            >
              {isLoading ? 'Entrando...' : 'ENTRAR 🎯'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

