// web/src/lib/auth.ts

/** Chave usada no localStorage para o token de sessão */
export const TOKEN_KEY = 'token';

/** Lê o token do storage de forma SSR-safe e com try/catch */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Salva/atualiza o token no storage (SSR-safe) */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    notifyAuthListeners(true);
  } catch {
    // ignore
  }
}

/** Remove o token do storage (logout) */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    notifyAuthListeners(false);
  } catch {
    // ignore
  }
}

/** Retorna true se há token em memória/storage */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/* ======= Sync entre abas (opcional, mas útil) ======= */

/** Callback para mudanças de autenticação (login/logout) em QUALQUER aba */
type AuthListener = (isLoggedIn: boolean) => void;

const listeners = new Set<AuthListener>();

function notifyAuthListeners(isLoggedIn: boolean) {
  // chama listeners na aba atual
  for (const cb of listeners) {
    try {
      cb(isLoggedIn);
    } catch {
      // ignore
    }
  }
}

/**
 * Registra um listener que dispara quando ocorrer login/logout
 * (inclui eventos via `storage`, ou seja, mudanças em outra aba).
 * Retorna uma função para desregistrar.
 */
export function onAuthChange(listener: AuthListener): () => void {
  listeners.add(listener);

  if (typeof window !== 'undefined') {
    const handleStorage = (ev: StorageEvent) => {
      if (ev.key === TOKEN_KEY) {
        const logged = !!ev.newValue;
        notifyAuthListeners(logged);
      }
    };
    window.addEventListener('storage', handleStorage);

    // cleanup
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
  }

  // ambiente sem window
  return () => {
    listeners.delete(listener);
  };
}
