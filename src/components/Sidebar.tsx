import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, MessageSquare, Calendar, BarChart3,
  Megaphone, AlertTriangle, Package, Users, Settings, Shield,
  ChevronLeft, ChevronRight, LogOut, Moon, Sun, Search,
  Zap, Menu, X, Tag, Rocket
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tab } from '@/types';
import { Truck, Lock } from 'lucide-react';
import NotificationsCenter from './NotificationsCenter';
import UpgradeModal from './UpgradeModal';

interface SidebarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  alertCount?: number;
  orderCount?: number;
  chatCount?: number;
  showAdmin?: boolean;
  onSearch?: () => void;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  id: Tab;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: number;
  locked?: boolean;
}

const getNavGroups = (
  alertCount: number, 
  orderCount: number, 
  chatCount: number, 
  showAdmin: boolean,
  plano: string | null
): NavGroup[] => {
  const isStarter = plano === 'starter' || plano === 'profissional' || plano === 'enterprise';
  const isPro = plano === 'profissional' || plano === 'enterprise';
  const isEnterprise = plano === 'enterprise';

  const groups: NavGroup[] = [
    {
      label: 'Principal',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
        { id: 'orders', icon: ShoppingBag, label: 'Pedidos', badge: orderCount },
        { id: 'chat', icon: MessageSquare, label: 'Conversas', badge: chatCount },
        { id: 'delivery', icon: Truck, label: 'Entregas' },
      ],
    },
    {
      label: 'CRM',
      items: [
        { id: 'pipeline', icon: BarChart3, label: 'Pipeline', locked: !isPro },
        { id: 'clients', icon: Users, label: 'Clientes', locked: !isPro },
        { id: 'campaigns', icon: Megaphone, label: 'Campanhas', locked: !isPro },
        { id: 'automation', icon: Zap, label: 'Automação', locked: !isPro },
        { id: 'schedule', icon: Calendar, label: 'Agenda', locked: !isStarter },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { id: 'products', icon: Tag, label: 'Produtos' },
        { id: 'stock', icon: Package, label: 'Estoque' },
        { id: 'alerts', icon: AlertTriangle, label: 'Alertas', badge: alertCount },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { id: 'settings', icon: Settings, label: 'Configurações' },
        ...(showAdmin ? [{ id: 'admin' as Tab, icon: Shield, label: 'Admin', locked: !isPro }] : []),
      ],
    },
  ];
  return groups;
};

export default function Sidebar({ active, onChange, alertCount = 0, orderCount = 0, chatCount = 0, showAdmin = false, onSearch }: SidebarProps) {
  const { signOut, userName, plano } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return true;
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const navGroups = getNavGroups(alertCount, orderCount, chatCount, showAdmin, plano);

  const handleTabChange = (item: NavItem) => {
    if (item.locked) {
      setUpgradeOpen(true);
      return;
    }
    onChange(item.id);
    setMobileOpen(false);
  };

  const initials = userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap flex-1"
            >
              <h1 className="text-[15px] font-bold text-foreground leading-tight">ZapVendas</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">CRM WhatsApp</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notifications Center */}
        <div className={collapsed ? "hidden" : "block"}>
          <NotificationsCenter />
        </div>
      </div>

      {/* Search button */}
      {onSearch && (
        <div className="px-3 pt-3">
          <button
            onClick={onSearch}
            className={`w-full flex items-center gap-2 rounded-xl text-sm transition-all duration-200
              ${collapsed
                ? 'justify-center p-2.5 bg-secondary text-muted-foreground hover:text-foreground'
                : 'px-3 py-2.5 bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-xs">Buscar...</span>
                <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-border px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-3 mb-1.5"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item)}
                    className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative
                      ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}
                      ${isActive
                        ? 'bg-primary/10 text-primary font-medium shadow-sm'
                        : item.locked 
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    title={collapsed ? (item.locked ? `${item.label} (BLOQUEADO)` : item.label) : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary shadow-[2px_0_8px_rgba(34,197,94,0.4)]" />
                    )}
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-primary' : ''}`} strokeWidth={isActive ? 2.2 : 1.7} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-[13px] overflow-hidden whitespace-nowrap flex-1 text-left"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {(item.badge ?? 0) > 0 && (
                      <span className={`min-w-[18px] h-[18px] rounded-full bg-[hsl(var(--badge-red))] text-white text-[10px] font-bold flex items-center justify-center px-1
                        ${collapsed ? 'absolute -top-0.5 -right-0.5' : ''}`}
                      >
                        {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-2 flex-shrink-0">
        {/* Upgrade Call to Action */}
        {plano !== 'enterprise' && !collapsed && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="w-full mb-2 p-3 rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white flex flex-col gap-1 hover:brightness-110 transition-all shadow-glow group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Plano {plano || 'Iniciante'}</span>
              <Rocket className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
            <span className="text-[12px] font-bold text-left">Fazer Upgrade</span>
          </button>
        )}
        {plano !== 'enterprise' && collapsed && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-110 transition-all shadow-glow"
            title="Fazer Upgrade"
          >
            <Rocket className="w-4 h-4" />
          </button>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200
            ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}
            text-sidebar-foreground hover:bg-sidebar-accent`}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {!collapsed && <span className="text-[13px]">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        {/* User profile */}
        <div className={`flex items-center gap-3 rounded-2xl bg-muted/30 p-2.5 transition-all
          ${collapsed ? 'justify-center w-10 h-10 p-0 mx-auto' : 'px-3 py-2.5'}`}
        >
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20">
            <span className="text-white text-[10px] font-black tracking-tighter">{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-foreground truncate">{userName || 'Admin'}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Administrador</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-card border border-border/50 shadow-sm">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </div>
          {!collapsed && <span className="text-[11px] font-semibold">Recolher Menu</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[60] w-10 h-10 rounded-xl bg-card shadow-card border border-border flex items-center justify-center text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-[80] w-[280px] bg-sidebar-background border-r border-sidebar-border shadow-elevated"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex fixed top-0 left-0 bottom-0 z-40 bg-sidebar-background border-r border-sidebar-border flex-col"
      >
        {sidebarContent}
      </motion.aside>
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}
