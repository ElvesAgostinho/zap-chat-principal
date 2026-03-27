import { Zap } from 'lucide-react';

interface AppHeaderProps {
  rightContent?: React.ReactNode;
  storeName?: string;
  subtitle?: string;
}

export default function AppHeader({ rightContent, storeName, subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full glassmorphism-header border-b border-white/10 shadow-lg backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center gap-4">
        <div className="w-10 h-10 rounded-[14px] bg-primary flex items-center justify-center flex-shrink-0 shadow-glow group cursor-pointer hover:rotate-12 transition-transform duration-500">
          <Zap className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-display font-bold text-foreground leading-tight truncate">{storeName || 'CRM TOP'}</h1>
          <p className="text-[10px] text-muted-foreground leading-tight font-bold uppercase tracking-[0.2em] mt-0.5">
            {subtitle || 'Plataforma Enterprise'}
          </p>
        </div>
        {rightContent && <div className="flex-shrink-0 flex items-center gap-3">{rightContent}</div>}
      </div>
    </header>
  );
}
