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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] transition-colors shadow-lg">
      <div className="grid grid-cols-5 items-end max-w-md mx-auto">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
            currentTab === 'dashboard'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${currentTab === 'dashboard' ? 'bg-primary/10' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-khmer mt-0.5 leading-tight">{t.nav.dashboard}</span>
        </button>

        {/* Customers */}
        <button
          onClick={() => onSelectTab('customers')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
            currentTab === 'customers'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${currentTab === 'customers' ? 'bg-primary/10' : ''}`}>
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-khmer mt-0.5 leading-tight">{t.nav.customers}</span>
        </button>

        {/* Floating Quick Add */}
        <button
          onClick={onOpenAddCustomer}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer group active:scale-90 transition-transform"
          aria-label={t.dashboard.addNewCustomer}
        >
          <div className="w-13 h-13 rounded-full bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground flex items-center justify-center shadow-lg transform transition-all border-2 border-card ring-2 ring-primary/20">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold font-khmer mt-1 text-foreground">
            {t.common.actions}
          </span>
        </button>

        {/* Notes */}
        <button
          onClick={() => onSelectTab('notes')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
            currentTab === 'notes'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${currentTab === 'notes' ? 'bg-primary/10' : ''}`}>
            <StickyNote className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-khmer mt-0.5 leading-tight">{t.nav.notes}</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
            currentTab === 'settings'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${currentTab === 'settings' ? 'bg-primary/10' : ''}`}>
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-khmer mt-0.5 leading-tight">{t.nav.settings}</span>
        </button>
      </div>
    </nav>
  );
};
