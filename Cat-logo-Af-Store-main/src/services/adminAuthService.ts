import { supabase } from '../integrations/supabase/client';

export const adminAuthService = {
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    return { session, error };
  },

  async isAuthenticated(): Promise<{ isAuthenticated: boolean; error?: string }> {
    const { session, error: sessionError } = await this.getSession();

    if (sessionError || !session?.user) {
      return { isAuthenticated: false, error: 'Faça login para continuar.' };
    }
    return { isAuthenticated: true };
  },

  async hasSession(): Promise<boolean> {
    const { session } = await this.getSession();
    return Boolean(session);
  },

  async isAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
    const { session, error: sessionError } = await this.getSession();

    if (sessionError || !session?.user) {
      return { isAdmin: false, error: 'Faça login para continuar.' };
    }

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

    return { isAdmin: true };
  },

  async signOut() {
    await supabase.auth.signOut();
  },
};
