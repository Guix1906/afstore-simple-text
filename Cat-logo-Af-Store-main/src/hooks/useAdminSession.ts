import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { adminAuthService } from '../services/adminAuthService';

export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession ?? null);

      if (!currentSession?.user) {
        setIsAdmin(false);
        setIsReady(true);
        return;
      }

      const { isAdmin: hasAdminRole } = await adminAuthService.isAdmin();
      if (!mounted) return;

      setIsAdmin(hasAdminRole);
      setIsReady(true);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);

      if (!nextSession?.user) {
        setIsAdmin(false);
        setIsReady(true);
        return;
      }

      void adminAuthService.isAdmin().then(({ isAdmin: hasAdminRole }) => {
        if (!mounted) return;
        setIsAdmin(hasAdminRole);
        setIsReady(true);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    isReady,
    isAdmin,
  };
}