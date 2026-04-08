'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken, removeToken } from '@/utils/auth';
import { getProfile } from '@/services/userService';
import type { User } from '@/types';

// ─── Tipos del contexto ───────────────────────────────────────────────────────

interface AuthContextValue {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    /** Fuerza una re-lectura del perfil desde la API y actualiza `user` */
    refreshUser: () => Promise<void>;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Al montar: si hay token guardado, hidratar el perfil del usuario
    useEffect(() => {
        const storedToken = getToken();
        console.log('[PetWell Auth] Mount — token en localStorage:', storedToken ? `${storedToken.substring(0, 20)}...` : 'NULL');
        if (!storedToken) {
            setLoading(false);
            return;
        }
        setToken(storedToken);
        fetchUser(storedToken);
    }, []);

    /** Llama GET /users/profile y guarda el usuario en el estado */
    const fetchUser = async (jwt: string) => {
        try {
            const res = await getProfile(jwt);
            if (res.success && res.data) {
                console.log('[PetWell Auth] Perfil cargado:', res.data.email, '| Rol:', res.data.role);
                setUser(res.data);
            } else {
                console.warn('[PetWell Auth] Token inválido o expirado, limpiando sesión');
                removeToken();
                setToken(null);
                setUser(null);
            }
        } catch (err) {
            console.error('[PetWell Auth] Error de red al cargar perfil:', err);
            // Si falla la red no deslogueamos; el usuario podrá reintentar
        } finally {
            setLoading(false);
        }
    };

    const login = async (newToken: string, tempUser: User) => {
        // Validación defensiva: el token debe ser un string no vacío
        if (!newToken || typeof newToken !== 'string' || newToken.trim() === '') {
            console.error('[PetWell Auth] ⛔ Token inválido recibido en login():', newToken);
            return;
        }

        console.log('[PetWell Auth] ✅ Login — guardando token:', newToken.substring(0, 20) + '...');
        console.log('[PetWell Auth] ✅ Login — usuario temporal:', tempUser.email, '| Rol:', tempUser.role);

        saveToken(newToken);
        setToken(newToken);
        // Set temp user immediately for fast UI feedback
        setUser(tempUser);

        // Verificar que se guardó correctamente en localStorage
        const stored = getToken();
        console.log('[PetWell Auth] ✅ Token verificado en localStorage:', stored ? 'OK' : '⛔ FALLO');
        
        // Then forcefully refresh profile to ensure all fields (like clinic_id) are present
        try {
            const res = await getProfile(newToken);
            if (res.success && res.data) {
                console.log('[PetWell Auth] ✅ Perfil completo cargado:', res.data.email, '| Rol:', res.data.role, '| clinic_id:', res.data.clinic_id ?? 'N/A');
                setUser(res.data);
            }
        } catch (e) {
            console.error('[PetWell Auth] Error fetching full profile after login:', e);
        }
    };

    const logout = () => {
        removeToken();
        setToken(null);
        setUser(null);
    };

    /** Útil después de actualizar el perfil para sincronizar el contexto */
    const refreshUser = async () => {
        const jwt = getToken();
        if (jwt) await fetchUser(jwt);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                loading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook de acceso al contexto ───────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
    }
    return ctx;
}

export default AuthContext;
