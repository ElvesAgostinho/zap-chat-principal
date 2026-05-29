import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Users, Megaphone, Settings, Shield,
  LogOut, Menu, X, Zap, Bot
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tab } from '@/types';
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
  icon: any;
  label: string;
  badge?: number;
  locked?: boolean;
}

const getNavGroups = (
  chatCount: number, 
  showAdmin: boolean,
  plano: string | null
): NavGroup[] => {
  const p = plano?.toLowerCase() || '';
  const isHighTier = ['profissional', 'enterprise'].includes(p) || showAdmin;

  return [
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
};

export default function Sidebar({ active, onChange, chatCount = 0, showAdmin = false }: SidebarProps) {
  const { signOut, userName, plano, storeProfilePic, role } = useAuth();
  
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const navGroups = getNavGroups(chatCount, showAdmin, plano);
  const isExpanded = isHovered || mobileOpen;

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
    <div className="flex flex-col h-full bg-white relative">
      {/* Logo */}
      <div className={`flex items-center h-20 flex-shrink-0 transition-all duration-300 ${isExpanded ? 'px-6' : 'px-4 justify-center'}`}>
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0 relative overflow-hidden" title="ZapCRM PRO">
          <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
          <MessageSquare className="w-5 h-5 text-white fill-white/20 absolute" />
          <Zap className="w-3 h-3 text-white fill-white absolute" />
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-bold text-slate-800 text-lg leading-tight">ZapCRM</h1>
              <p className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-wider">PRO Edition</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-3 py-4 space-y-6">
        {navGroups.map(group => (
          <div key={group.label} className="space-y-2 relative">
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.label}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = active === item.id;
                return (
                  <div key={item.id} className="relative flex items-center w-full group">
                    {/* Active Indicator on the very edge */}
                    {isActive && (
                      <motion.div 
                        layoutId="active-sidebar-indicator"
                        className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-[#0ea5e9]" 
                      />
                    )}
                    
                    <button
                      onClick={() => handleTabChange(item)}
                      className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200
                        ${isActive
                          ? 'bg-[#f0f9ff] text-[#0ea5e9]'
                          : item.locked 
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      title={!isExpanded ? item.label : undefined}
                    >
                      <div className="flex items-center justify-center min-w-[24px]">
                        <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="font-medium whitespace-nowrap overflow-hidden text-sm ml-3 text-left flex-1"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {(item.badge ?? 0) > 0 && isExpanded && (
                        <span className="ml-auto min-w-[20px] h-[20px] rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold flex items-center justify-center px-1.5 shadow-sm">
                          {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      
                      {(item.badge ?? 0) > 0 && !isExpanded && (
                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#0ea5e9] border-2 border-white shadow-sm" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className={`p-4 space-y-4 flex-shrink-0 flex flex-col transition-all duration-300 border-t border-slate-100 ${isExpanded ? 'px-5' : 'px-2 items-center'}`}>
        <div className={`flex items-center gap-3 ${isExpanded ? 'justify-start' : 'justify-center'} w-full`}>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden" title={userName || 'Perfil'}>
            {storeProfilePic ? (
              <img src={storeProfilePic} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-bold">{initials}</span>
            )}
          </div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <div className="text-sm font-bold text-slate-800 truncate">{userName || 'Usuário'}</div>
                <div className="text-[11px] text-slate-500 truncate">{role === 'admin' ? 'Administrador' : 'Atendente'}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isExpanded && (
               <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={signOut}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {!isExpanded && (
          <button
            onClick={signOut}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex justify-center w-full"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[60] w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-800"
      >
        <Menu className="w-5 h-5" />
      </button>

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
              className="lg:hidden fixed top-0 left-0 bottom-0 z-[80] w-[280px] bg-white border-r border-slate-200 shadow-xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-2 z-10 rounded-lg text-slate-400 hover:text-slate-800"
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={false}
        animate={{ width: isHovered ? 260 : 80 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="hidden lg:flex fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200 flex-col overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        {sidebarContent}
      </motion.aside>
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}
