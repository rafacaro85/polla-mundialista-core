import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { User } from '@/types/types';
import api from '@/lib/api';

/**
 * Estado global de la aplicación
 */
interface AppState {
    // --- STATE ---
    user: User | null;
    selectedLeagueId: string; // 'global' por defecto
    isLoading: boolean;

    // --- ACTIONS ---
    setUser: (user: User | null) => void;
    setSelectedLeague: (id: string) => void;
    logout: () => void;
    syncUserFromServer: () => Promise<void>;
}

/**
 * Store principal de la aplicación usando Zustand
 * 
 * Features:
 * - Persist: Sincroniza automáticamente con localStorage
 * - Devtools: Debugging en desarrollo
 * - Type-safe: TypeScript estricto
 */
export const useAppStore = create<AppState>()(
    devtools(
        persist(
            (set, get) => ({
                // --- INITIAL STATE ---
                user: null,
                selectedLeagueId: 'global',
                isLoading: false,

                // --- ACTIONS ---

                /**
                 * Actualiza el usuario en el store y localStorage
                 */
                setUser: (user) => {
                    console.log('🔄 [Store] Actualizando usuario:', user?.email);
                    set({ user }, false, 'setUser');

                    // Sincronizar con localStorage manualmente para compatibilidad
                    if (user) {
                        localStorage.setItem('user', JSON.stringify(user));
                    } else {
                        localStorage.removeItem('user');
                    }
                },

                /**
                 * Cambia la liga seleccionada
                 */
                setSelectedLeague: (id) => {
                    console.log('🔄 [Store] Cambiando liga a:', id);
                    set({ selectedLeagueId: id }, false, 'setSelectedLeague');
                },

                /**
                 * Cierra sesión y limpia todo el estado
                 */
                logout: async () => {
                    console.log('👋 [Store] Cerrando sesión...');

                    try {
                        // Llamar al endpoint de logout del backend
                        await api.post('/auth/logout').catch(() => {
                            // Ignorar errores del backend, continuar con logout local
                            console.log('⚠️ [Store] Error en logout del backend, continuando...');
                        });
                    } catch (error) {
                        console.log('⚠️ [Store] Error en logout:', error);
                    }

                    // Limpiar TODO el localStorage y sessionStorage
                    localStorage.clear();
                    sessionStorage.clear();

                    // Resetear store
                    set(
                        {
                            user: null,
                            selectedLeagueId: 'global',
                            isLoading: false,
                        },
                        false,
                        'logout'
                    );

                    // Redirigir al login
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                },

                /**
                 * Sincroniza el usuario desde el servidor
                 * Útil para obtener datos frescos (ej: cambios de rol)
                 */
                syncUserFromServer: async () => {
                    try {
                        console.log('🔄 [Store] Sincronizando usuario desde servidor...');
                        set({ isLoading: true }, false, 'syncUserFromServer:start');

                        const { data } = await api.get('/auth/profile');

                        console.log('✅ [Store] Usuario sincronizado:', data.email);
                        console.log('   📌 Rol:', data.role);

                        get().setUser(data);
                    } catch (error) {
                        console.error('❌ [Store] Error sincronizando usuario:', error);
                        // Si falla, intentar usar datos del localStorage
                        const storedUser = localStorage.getItem('user');
                        if (storedUser) {
                            try {
                                const user = JSON.parse(storedUser);
                                get().setUser(user);
                            } catch (e) {
                                console.error('❌ [Store] Error parseando usuario del localStorage');
                            }
                        }
                    } finally {
                        set({ isLoading: false }, false, 'syncUserFromServer:end');
                    }
                },
            }),
            {
                name: 'app-storage', // Nombre en localStorage
                partialize: (state) => ({
                    // Solo persistir estos campos
                    user: state.user,
                    selectedLeagueId: state.selectedLeagueId,
                }),
            }
        ),
        {
            name: 'AppStore', // Nombre en DevTools
            enabled: process.env.NODE_ENV === 'development',
        }
    )
);

/**
 * Selectores optimizados para evitar re-renders innecesarios
 */
export const selectUser = (state: AppState) => state.user;
export const selectSelectedLeagueId = (state: AppState) => state.selectedLeagueId;
export const selectIsLoading = (state: AppState) => state.isLoading;
