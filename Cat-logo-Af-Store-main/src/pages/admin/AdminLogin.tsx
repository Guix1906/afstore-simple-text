import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { Lock } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { adminAuthService } from '../../services/adminAuthService';
import { useAdminSession } from '../../hooks/useAdminSession';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isReady, session, isAdmin } = useAdminSession();

  React.useEffect(() => {
    if (!isReady) return;
    if (session?.user && isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAdmin, isReady, navigate, session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 6) {
      setError('Use um email válido e senha com no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) throw signUpError;
        setMessage('Cadastro realizado. Verifique seu email para confirmar a conta.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) throw signInError;

        const { isAdmin: hasAdminRole, error: adminError } = await adminAuthService.isAdmin();
        if (!hasAdminRole) {
          await adminAuthService.signOut();
          throw new Error(adminError || 'Seu usuário não possui permissão de administrador.');
        }

        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegisterMode = async () => {
    setError('');
    setMessage('');

    if (isRegisterMode) {
      setIsRegisterMode(false);
      return;
    }

    const accessPassword = window.prompt('Digite a senha de liberação para criar novo acesso:');
    if (!accessPassword?.trim()) return;

    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-admin-access-password', {
        body: { password: accessPassword.trim() },
      });

      if (verifyError) throw verifyError;

      if (!data?.valid) {
        setError('Senha de liberação inválida.');
        return;
      }

      setIsRegisterMode(true);
      setMessage('Liberação confirmada. Agora você pode criar um novo acesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível validar a senha de liberação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8 bg-brand-card p-8 rounded-3xl border border-brand-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-50" />
          
          <div className="text-center space-y-2">
            <div className="bg-brand-gold/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-gold/20 shadow-inner">
              <Lock className="text-brand-gold" size={36} />
            </div>
            <h1 className="text-3xl font-serif italic text-brand-gold">Acesso Restrito</h1>
            <p className="text-[10px] text-brand-text-muted font-sans font-extrabold uppercase tracking-[0.2em]">Painel Administrativo Antigravity</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-brand-text-muted ml-1">
                Email Corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-4 text-sm font-sans focus:outline-none focus:border-brand-gold transition-all shadow-inner"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-brand-text-muted ml-1">
                Chave de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-4 text-sm font-sans focus:outline-none focus:border-brand-gold transition-all shadow-inner"
                placeholder="••••••••"
                minLength={6}
                required
              />
              {error && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-2">{error}</p>}
              {message && <p className="text-[10px] text-brand-gold font-bold uppercase tracking-wider mt-2">{message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !isReady}
              className="btn-primary w-full py-5 flex items-center justify-center gap-2 group shadow-xl"
            >
              {loading || !isReady ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                isRegisterMode ? 'Criar Acesso' : 'Autenticar'
              )}
            </button>

            <div className="flex flex-col gap-4 pt-4 border-t border-brand-border/50">
              <button
                type="button"
                onClick={handleToggleRegisterMode}
                disabled={loading}
                className="text-[9px] font-sans font-extrabold uppercase tracking-[0.2em] text-brand-text-muted hover:text-brand-gold transition-colors"
              >
                {isRegisterMode ? 'Voltar para Login' : 'Solicitar Novo Acesso'}
              </button>

            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
