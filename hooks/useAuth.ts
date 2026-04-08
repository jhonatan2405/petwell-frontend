'use client';

import { useAuthContext } from '@/context/AuthContext';

/**
 * Hook de conveniencia para acceder al contexto de autenticación.
 * Devuelve { user, token, isAuthenticated, loading, login, logout }
 */
export function useAuth() {
    return useAuthContext();
}

export default useAuth;
