import { Zap } from 'lucide-react';

interface AppHeaderProps {
  rightContent?: React.ReactNode;
  storeName?: string;
  storeCode?: string;
}

export default function AppHeader({ rightContent, storeName, storeCode }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full gradient-header shadow-md">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 h-14 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-white leading-tight truncate">{storeName || 'ZapVendas'}</h1>
          <p className="text-[10px] text-white/60 leading-tight">
            {storeCode ? `Código: ${storeCode}` : 'CRM via WhatsApp'}
          </p>
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
    </header>
  );
}
