import { supabase } from '../integrations/supabase/client';

export const adminAuthService = {
  async isAuthenticated(): Promise<{ isAuthenticated: boolean; error?: string }> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return { isAuthenticated: false, error: 'Faça login para continuar.' };
    }
    return { isAuthenticated: true };
  },

  async hasSession(): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return Boolean(session);
  },

  async isAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return { isAdmin: false, error: 'Faça login para continuar.' };
    }

    // Tentar recuperar do cache para navegação instantânea
    const cacheKey = `is_admin_${session.user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached === 'true') return { isAdmin: true };

    const { data, error } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      return { isAdmin: false, error: 'Não foi possível validar sua permissão de admin.' };
    }

    if (!data) {
      return { isAdmin: false, error: 'Seu usuário não possui permissão de administrador.' };
    }

    // Salvar no cache
    sessionStorage.setItem(cacheKey, 'true');
    return { isAdmin: true };
  },

  async signOut() {
    // Limpar todos os caches de sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      sessionStorage.removeItem(`is_admin_${session.user.id}`);
    }
    await supabase.auth.signOut();
  },
};
