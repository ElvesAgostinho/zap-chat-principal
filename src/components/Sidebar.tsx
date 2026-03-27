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
  storeName?: string;
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
  const p = plano?.toLowerCase();
  const isStarter = p === 'starter' || p === 'profissional' || p === 'enterprise';
  const isPro = p === 'profissional' || p === 'enterprise';
  const isEnterprise = p === 'enterprise';

  const groups: NavGroup[] = [
    {
      label: 'Principal',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Painel Hub' },
        { id: 'orders', icon: ShoppingBag, label: 'Pedidos', badge: orderCount },
        { id: 'chat', icon: MessageSquare, label: 'Conversas', badge: chatCount },
        { id: 'delivery', icon: Truck, label: 'Logística' },
      ],
    },
    {
      label: 'CRM & Operações',
      items: [
        { id: 'pipeline', icon: BarChart3, label: 'Pipeline', locked: !isPro },
        { id: 'clients', icon: Users, label: 'Potenciais Clientes', locked: !isPro },
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

export default function Sidebar({ active, onChange, alertCount = 0, orderCount = 0, chatCount = 0, showAdmin = false, onSearch, storeName }: SidebarProps) {
  const { signOut, userName, plano, storeProfilePic, storePhone, role } = useAuth();
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
    <div className="flex flex-col h-full bg-sidebar-background/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-white/5 flex-shrink-0 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-[0_0_25px_rgba(52,211,153,0.3)] border border-white/20">
          <Zap className="w-6 h-6 text-primary-foreground" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap flex-1"
            >
              <h1 className="text-[16px] font-bold text-foreground leading-tight tracking-tight truncate font-display">{storeName || 'CRM TOP'}</h1>
              <p className="text-[9px] text-primary/80 font-black uppercase tracking-[0.2em] leading-none mt-1">Enterprise Hub</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-6 pb-6">
        {navGroups.map(group => (
          <div key={group.label} className="space-y-1">
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] uppercase font-bold tracking-[0.2em] px-3 mb-2 text-muted-foreground/50 sidebar-group-label"
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
                    className={`w-full flex items-center gap-3 rounded-xl transition-all duration-300 group relative
                      ${collapsed ? 'justify-center py-3' : 'px-3 py-2.5'}
                      ${isActive
                        ? 'bg-primary/10 text-primary'
                        : item.locked 
                        ? 'text-muted-foreground/30 cursor-not-allowed'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                      }`}
                    title={collapsed ? (item.locked ? `${item.label} (BLOQUEADO)` : item.label) : undefined}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav-indicator"
                        className="absolute left-[-4px] w-1.5 h-6 rounded-full bg-primary shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                      />
                    )}
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-primary' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`text-[13px] font-semibold overflow-hidden whitespace-nowrap flex-1 text-left sidebar-item-text ${isActive ? 'text-primary' : ''}`}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {(item.badge ?? 0) > 0 && !collapsed && (
                      <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center px-1 shadow-glow">
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
      <div className="border-t border-white/5 px-4 py-6 space-y-4 flex-shrink-0">
        {/* Upgrade Call to Action */}
        {plano !== 'enterprise' && !collapsed && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="w-full mb-2 p-3.5 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-emerald-600 text-primary-foreground flex flex-col gap-1 hover:brightness-110 transition-all shadow-glow group border border-white/10"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Plano {plano || 'Iniciante'}</span>
              <Rocket className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
            <span className="text-[13px] font-bold text-left font-display">Expandir Limites</span>
          </button>
        )}
        
        {/* User Card */}
        <div className={`p-1 rounded-2xl bg-white/[0.03] border border-white/5 transition-all
          ${collapsed ? 'mb-2' : ''}`}
        >
          {/* WhatsApp Info */}
          {(storeProfilePic || storePhone) && (
            <div className={`flex items-center gap-3 w-full p-2 ${collapsed ? 'justify-center p-1' : 'border-b border-white/5 mb-1'}`}>
              {storeProfilePic ? (
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-emerald-500/30">
                  <img src={storeProfilePic} alt="WhatsApp Avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                  <span className="text-emerald-500"><Zap className="w-4 h-4" /></span>
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-emerald-500 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    WhatsApp Ativo
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono mt-0.5 truncate">{storePhone ? `+${storePhone}` : 'Conectado'}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
             {/* Mode toggle inside card */}
            <button
              onClick={toggleDark}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200
                ${collapsed ? 'justify-center p-2' : 'px-2 py-2'}
                text-muted-foreground hover:text-foreground hover:bg-white/5`}
              title={isDark ? 'Modo claro' : 'Modo escuro'}
            >
              {isDark ? <Sun className="w-[16px] h-[16px]" /> : <Moon className="w-[16px] h-[16px]" />}
              {!collapsed && <span className="text-[12px] font-medium">{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>}
            </button>

            {/* User Info */}
            {!collapsed && (
              <div className="flex items-center gap-3 w-full p-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20">
                  <span className="text-primary-foreground text-[10px] font-black tracking-tighter">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-foreground truncate">{userName || 'Admin'}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">{role === 'admin' ? 'Administrador' : 'Funcionário'}</p>
                </div>
                
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        {!mobileOpen && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl py-1 text-muted-foreground hover:text-foreground transition-all group"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 shadow-sm group-hover:border-white/10 transition-colors">
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </div>
          </button>
        )}
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
