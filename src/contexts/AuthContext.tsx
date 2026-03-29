import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type MembershipState = 'loading' | 'linked' | 'pending' | 'rejected' | 'unlinked' | 'error' | 'super_admin';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: string | null;
  storeId: string | null;
  storeSlug: string | null;
  storeCode: string | null;
  storeName: string | null;
  status: string | null;
  userName: string | null;
  loading: boolean;
  membershipState: MembershipState;
  isSuperAdmin: boolean;
  plano: 'starter' | 'profissional' | 'enterprise' | null;
  statusLoja: 'pendente_aprovacao' | 'ativo' | 'suspenso' | 'cancelado' | 'eliminado' | null;
  storeProfilePic: string | null;
  storePhone: string | null;
  dataFim: string | null;
  isExpired: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  role: null,
  storeId: null,
  storeSlug: null,
  storeCode: null,
  storeName: null,
  status: null,
  userName: null,
  loading: true,
  membershipState: 'loading',
  isSuperAdmin: false,
  plano: null,
  statusLoja: null,
  storeProfilePic: null,
  storePhone: null,
  dataFim: null,
  isExpired: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  let timeoutId: number | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [storeCode, setStoreCode] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [membershipState, setMembershipState] = useState<MembershipState>('loading');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [plano, setPlano] = useState<'starter' | 'profissional' | 'enterprise' | null>(null);
  const [statusLoja, setStatusLoja] = useState<'pendente_aprovacao' | 'ativo' | 'suspenso' | 'cancelado' | 'eliminado' | null>(null);
  const [storeProfilePic, setStoreProfilePic] = useState<string | null>(null);
  const [storePhone, setStorePhone] = useState<string | null>(null);
  const [dataFim, setDataFim] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const versionRef = useRef(0);

  const clearMembership = () => {
    setRole(null);
    setStoreId(null);
    setStoreSlug(null);
    setStoreCode(null);
    setStoreName(null);
    setStatus(null);
    setUserName(null);
    setIsSuperAdmin(false);
    setPlano(null);
    setStatusLoja(null);
    setStoreProfilePic(null);
    setStorePhone(null);
    setDataFim(null);
    setIsExpired(false);
  };

  const checkSuperAdmin = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await (supabase as any)
        .from('super_admins')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      return !error && !!data;
    } catch {
      return false;
    }
  };

  const fetchMembership = async () => {
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await withTimeout<any>(
          (supabase as any).rpc('get_my_membership'),
          4000,
          'get_my_membership timeout'
        );

        if (result?.error) {
          lastError = result.error;
        } else {
          return Array.isArray(result?.data) ? (result.data[0] ?? null) : (result?.data ?? null);
        }
      } catch (error) {
        lastError = error;
      }

      if (attempt < 2) {
        await delay(300 * (attempt + 1));
      }
    }

    throw lastError ?? new Error('Failed to resolve membership');
  };

  const resolveAuthState = async (nextSession: Session | null, version: number) => {
    if (versionRef.current !== version) return;

    if (!nextSession?.user) {
      setSession(null);
      setUser(null);
      clearMembership();
      setMembershipState('unlinked');
      setLoading(false);
      return;
    }

    setSession(nextSession);
    setUser(nextSession.user);

    try {
      // Check super admin first
      const superAdmin = await checkSuperAdmin(nextSession.user.id);
      if (versionRef.current !== version) return;

      if (superAdmin) {
        setIsSuperAdmin(true);
        setRole('super_admin');
        setStatus('aprovado');
        setUserName(nextSession.user.user_metadata?.full_name || 'Super Admin');
        setStoreId(null);
        setStoreSlug(null);
        setStoreCode(null);
        setStoreName(null);
        setMembershipState('super_admin');
        setPlano('enterprise'); // Super admin has max access
        setStatusLoja('ativo');
        setIsExpired(false);
        setLoading(false);
        return;
      }

      // Normal membership flow
      const membership = await fetchMembership();
      if (versionRef.current !== version) return;

      if (!membership) {
        clearMembership();
        setMembershipState('unlinked');
        return;
      }

      setRole(membership.role ?? null);
      setStatus(membership.status ?? null);
      setUserName(membership.nome ?? null);

      if (membership.status === 'aprovado') {
        const sId = membership.loja_id ?? null;
        setStoreId(sId);
        
        // Fetch plan and statusLoja from the store table
        if (sId) {
          const { data: storeData } = await (supabase as any)
            .from('lojas')
            .select('plano, status_aprovacao, slug, nome, profile_picture_url, phone, codigo_unico')
            .eq('id', sId)
            .maybeSingle();
            
          if (storeData) {
            setPlano(storeData.plano);
            setStatusLoja(storeData.status_aprovacao);
            setStoreName(storeData.nome);
            setStoreSlug(storeData.slug || null);
            setStoreCode(storeData.codigo_unico);
            
            // Garantir que temos pelo menos um identificador para links
            if (!storeData.slug && storeData.codigo_unico) {
              console.warn("Loja sem slug definido, usando código único como fallback.");
            }
            
            setStoreProfilePic(storeData.profile_picture_url || null);
            setStorePhone(storeData.phone || null);

            // Fetch active subscription for expiration date
            const { data: sub } = await supabase
              .from('assinaturas')
              .select('data_fim')
              .eq('loja_id', sId)
              .eq('status', 'ativo')
              .maybeSingle();
            
            if (sub && sub.data_fim) {
              setDataFim(sub.data_fim);
              const expDate = new Date(sub.data_fim);
              setIsExpired(expDate < new Date());
            } else {
              setIsExpired(false);
            }
          }
        }
        
        setMembershipState('linked');
      } else if (membership.status === 'pendente') {
        setStoreId(null);
        setStoreSlug(null);
        setStoreCode(null);
        setStoreName(null);
        setMembershipState('pending');
      } else if (membership.status === 'rejeitado') {
        setStoreId(null);
        setStoreSlug(null);
        setStoreCode(null);
        setStoreName(null);
        setMembershipState('rejected');
      } else {
        setStoreId(null);
        setStoreSlug(null);
        setStoreCode(null);
        setStoreName(null);
        setMembershipState('unlinked');
      }
    } catch (error) {
      if (versionRef.current !== version) return;
      console.error('resolveAuthState error:', error);
      clearMembership();
      setMembershipState('error');
    } finally {
      if (versionRef.current === version) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const scheduleResolve = (nextSession: Session | null) => {
      const version = ++versionRef.current;
      setLoading(true);
      setMembershipState('loading');

      window.setTimeout(() => {
        if (!mounted) return;
        void resolveAuthState(nextSession, version);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted || event === 'INITIAL_SESSION') return;
      scheduleResolve(nextSession);
    });

    // BUG-02 + BUG-06 fix: Listen for real-time changes on the user's membership row.
    // When the Super Admin approves a store, usuarios_loja.status changes to 'aprovado'
    // and we re-resolve the auth state automatically — no manual logout needed.
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    let storeChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid || !mounted) return;

      realtimeChannel = supabase
        .channel('membership-watch-' + uid)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'usuarios_loja',
            filter: `user_id=eq.${uid}`,
          },
          async () => {
            if (!mounted) return;
            const { data: latest } = await supabase.auth.getSession();
            if (latest?.session && mounted) {
              scheduleResolve(latest.session);
            }
          }
        )
        .subscribe();

      // Listen for changes on the store itself (Plan or Approval updates)
      const { data: membership } = await (supabase as any).rpc('get_my_membership');
      const sId = Array.isArray(membership) ? membership[0]?.loja_id : membership?.loja_id;
      
      if (sId && mounted) {
        storeChannel = supabase
          .channel('store-watch-' + sId)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'lojas',
              filter: `id=eq.${sId}`,
            },
            async () => {
              if (!mounted) return;
              const { data: latest } = await supabase.auth.getSession();
              if (latest?.session && mounted) {
                scheduleResolve(latest.session);
              }
            }
          )
          .subscribe();
      }
    };

    const initFallback = window.setTimeout(() => {
      if (!mounted) return;
      console.warn('Auth initialization timeout');
      versionRef.current += 1;
      setSession(null);
      setUser(null);
      clearMembership();
      setMembershipState('error');
      setLoading(false);
    }, 8000);

    void (async () => {
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'getSession timeout'
        );

        if (!mounted) return;
        window.clearTimeout(initFallback);
        scheduleResolve(data.session);
        void setupRealtime();
      } catch (error) {
        if (!mounted) return;
        window.clearTimeout(initFallback);
        console.error('getSession failed:', error);
        versionRef.current += 1;
        setSession(null);
        setUser(null);
        clearMembership();
        setMembershipState('error');
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      window.clearTimeout(initFallback);
      subscription.unsubscribe();
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
      if (storeChannel) supabase.removeChannel(storeChannel);
    };
  }, []);

  const signOut = async () => {
    versionRef.current += 1;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    clearMembership();
    setMembershipState('unlinked');
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, session, role, storeId, storeSlug, storeCode, storeName, status, userName, 
        loading, membershipState, isSuperAdmin, 
        plano, statusLoja, storeProfilePic, storePhone, dataFim, isExpired, signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
