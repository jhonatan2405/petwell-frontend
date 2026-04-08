// ─── Constante de clave del token ────────────────────────────────────────────
const TOKEN_KEY = 'petwell_token';

// ─── Guardar token ───────────────────────────────────────────────────────────
export const saveToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
    }
};

// ─── Obtener token ───────────────────────────────────────────────────────────
export const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
};

// ─── Eliminar token ──────────────────────────────────────────────────────────
export const removeToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
    }
};

// ─── Verificar si está autenticado ───────────────────────────────────────────
export const isAuthenticated = (): boolean => {
    const token = getToken();
    return token !== null && token.trim() !== '';
};
