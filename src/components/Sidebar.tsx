import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Users, Megaphone, Settings, Shield,
  ChevronLeft, ChevronRight, LogOut, Moon, Sun, Search,
  Zap, Menu, X, Tag, Rocket, Bot
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
  const p = plano?.toLowerCase() || '';
  
  // High-tier plans: Profissional or Enterprise
  const isHighTier = ['profissional', 'enterprise'].includes(p) || showAdmin;

  const groups: NavGroup[] = [
    {
      label: 'Principal',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Painel Hub' },
        { id: 'chat', icon: MessageSquare, label: 'Conversas', badge: chatCount },
      ],
    },
    {
      label: 'CRM & Operações',
      items: [
        { id: 'clients', icon: Users, label: 'Clientes' },
        { id: 'campaigns', icon: Megaphone, label: 'Broadcasts' },
        { id: 'automation', icon: Bot, label: 'Automação', locked: !isHighTier },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { id: 'settings', icon: Settings, label: 'Configurações' },
        ...(showAdmin ? [{ id: 'admin' as Tab, icon: Shield, label: 'Admin', locked: false }] : []),
      ],
    },
  ];
  return groups;
};

export default function Sidebar({ active, onChange, alertCount = 0, orderCount = 0, chatCount = 0, showAdmin = false, onSearch, storeName }: SidebarProps) {
  const { signOut, userName, plano, storeProfilePic, storePhone, role } = useAuth();
  // Always collapsed on desktop for Manychat clone
  const collapsed = true;
  const [isDark, setIsDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);



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
  const p = (plano || '').toLowerCase();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-slate-100 flex-shrink-0 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#0ea5e9] flex items-center justify-center flex-shrink-0 shadow-sm">
          <Zap className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-3 space-y-4 pb-6 mt-2">
        {navGroups.map(group => (
          <div key={group.label} className="space-y-1 relative group/nav">
            <div className="space-y-2">
              {group.items.map(item => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item)}
                    className={`w-full flex items-center justify-center rounded-xl py-3 transition-all duration-200 relative
                      ${isActive
                        ? 'bg-sky-50 text-[#0ea5e9]'
                        : item.locked 
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                    title={item.label}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav-indicator"
                        className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-[#0ea5e9]" 
                      />
                    )}
                    <item.icon className={`w-[22px] h-[22px] flex-shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                    
                    {(item.badge ?? 0) > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] rounded-full bg-[#0ea5e9] text-white text-[9px] font-bold flex items-center justify-center px-1 border-2 border-white shadow-sm">
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
      <div className="border-t border-slate-100 px-3 py-4 space-y-4 flex-shrink-0 flex flex-col items-center">
        
        {/* User Card */}
        <div className="flex flex-col gap-3 items-center w-full">
          {/* WhatsApp Info */}
          {(storeProfilePic || storePhone) && (
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-slate-200" title={storePhone ? `+${storePhone}` : 'WhatsApp'}>
              {storeProfilePic ? (
                <img src={storeProfilePic} alt="WhatsApp Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0ea5e9]/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#0ea5e9]" />
                </div>
              )}
            </div>
          )}

          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm" title={userName || 'Perfil'}>
            <span className="text-white text-[10px] font-bold">{initials}</span>
          </div>
          
          <button
            onClick={signOut}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors w-full flex justify-center"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
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
        initial={false}
        animate={{ width: 80 }}
        className="hidden lg:flex fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-200 flex-col"
      >
        {sidebarContent}
      </motion.aside>
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}
