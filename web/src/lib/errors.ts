export function errorMessage(e: unknown): string {
  if (e instanceof Error && typeof e.message === 'string') return e.message;
  if (typeof e === 'string') return e;
  // Alguns libs jogam algo como { message: string }
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return 'Erro inesperado.';
  }
}