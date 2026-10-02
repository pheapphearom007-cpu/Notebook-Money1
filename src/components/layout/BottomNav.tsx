import React from 'react';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  StickyNote,
  Settings,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useLanguage } from '../../context/LanguageContext';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddCustomer: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddCustomer,
}) => {
  const { t } = useLanguage();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5 transition-colors">
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-khmer">{t.nav.dashboard}</span>
        </button>

        {/* Customers */}
        <button
          onClick={() => onSelectTab('customers')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
            currentTab === 'customers'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-khmer">{t.nav.customers}</span>
        </button>

        {/* Floating Quick Add */}
        <button
          onClick={onOpenAddCustomer}
          className="flex flex-col items-center justify-center -mt-4 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground flex items-center justify-center shadow-md transform active:scale-95 transition-transform border border-primary/20">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold font-khmer mt-1 text-foreground">
            {t.common.actions}
          </span>
        </button>

        {/* Notes */}
        <button
          onClick={() => onSelectTab('notes')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
            currentTab === 'notes'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <StickyNote className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-khmer">{t.nav.notes}</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
            currentTab === 'settings'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-khmer">{t.nav.settings}</span>
        </button>
      </div>
    </nav>
  );
};
