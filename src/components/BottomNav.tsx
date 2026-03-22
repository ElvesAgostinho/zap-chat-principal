import { motion } from 'framer-motion';
import {
  Package, Users, ShoppingBag, Megaphone, Settings, AlertTriangle,
  MessageSquare, Shield, LayoutDashboard, Calendar, BarChart3
} from 'lucide-react';

type Tab = 'dashboard' | 'orders' | 'chat' | 'clients' | 'products' | 'campaigns' | 'alerts' | 'settings' | 'admin' | 'schedule' | 'pipeline' | 'stock';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  alertCount?: number;
  orderCount?: number;
  chatCount?: number;
  showAdmin?: boolean;
}

const baseTabs: { id: Tab; icon: typeof Package; label: string; hasBadge?: boolean }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
  { id: 'orders', icon: ShoppingBag, label: 'Pedidos', hasBadge: true },
  { id: 'chat', icon: MessageSquare, label: 'Chat', hasBadge: true },
  { id: 'schedule', icon: Calendar, label: 'Agenda', hasBadge: true },
  { id: 'pipeline', icon: BarChart3, label: 'Pipeline', hasBadge: true },
  { id: 'campaigns', icon: Megaphone, label: 'Promoções', hasBadge: true },
  { id: 'alerts', icon: AlertTriangle, label: 'Alertas', hasBadge: true },
  { id: 'stock', icon: Package, label: 'Estoque' },
  { id: 'clients', icon: Users, label: 'Clientes' },
  { id: 'products', icon: Package, label: 'Produtos' },
  { id: 'settings', icon: Settings, label: 'Config' },
];

export default function BottomNav({ active, onChange, alertCount = 0, orderCount = 0, chatCount = 0, showAdmin = false }: BottomNavProps) {
  const tabs = showAdmin ? [...baseTabs, { id: 'admin' as Tab, icon: Shield, label: 'Admin' }] : baseTabs;

  const getBadge = (id: Tab): number => {
    if (id === 'alerts') return alertCount;
    if (id === 'orders') return orderCount;
    if (id === 'chat') return chatCount;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="max-w-5xl mx-auto overflow-x-auto scrollbar-hide">
        <div className="flex items-center px-1 py-1.5 min-w-max">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = active === id;
            const badge = getBadge(id);
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[48px] transition-colors
                  ${isActive ? 'text-[hsl(var(--whatsapp-mid))]' : 'text-muted-foreground hover:text-[hsl(var(--whatsapp-light))]'}`}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.2 : 1.6} />
                <span className={`text-[9px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                {badge > 0 && (
                  <span className="absolute -top-0.5 right-0 min-w-[16px] h-4 rounded-full bg-[hsl(var(--badge-red))] text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
