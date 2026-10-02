import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  StickyNote,
  Settings,
  X,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomers } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';

export type NavTab = 'dashboard' | 'customers' | 'add-customer' | 'notes' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenProfile,
}) => {
  const { t } = useLanguage();
  const { customers, notes, stats } = useCustomers();
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'customers' as NavTab,
      label: t.nav.customers,
      icon: Users,
      badge: customers.length > 0 ? customers.length : undefined,
    },
    {
      id: 'add-customer' as NavTab,
      label: t.nav.addCustomer,
      icon: UserPlus,
      badge: undefined,
    },
    {
      id: 'notes' as NavTab,
      label: t.nav.notes,
      icon: StickyNote,
      badge: notes.length > 0 ? notes.length : undefined,
    },
    {
      id: 'settings' as NavTab,
      label: t.nav.settings,
      icon: Settings,
      badge: undefined,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-6 px-4">
      {/* Navigation Links */}
      <div className="space-y-6">
        {/* Mobile Header Close */}
        <div className="lg:hidden flex items-center justify-between pb-3 border-b border-border">
          <span className="font-bold text-base text-foreground font-khmer">
            {t.appName}
          </span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Nav Items */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  <span className="font-khmer">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full font-mono ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Widget */}
      <div className="pt-4 border-t border-border">
        <div className="p-3.5 rounded-xl bg-muted border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground font-khmer">
              {t.dashboard.activeCustomers}
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 bg-primary text-primary-foreground rounded-md font-mono">
              {stats.activeCustomers} / {stats.totalCustomers}
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${
                  stats.totalCustomers > 0
                    ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between font-khmer">
            <span>{t.dashboard.todayNotes}:</span>
            <span className="font-bold text-foreground">
              {stats.todayNotes}
            </span>
          </p>
        </div>

        {/* User Account Card */}
        {user && (
          <div className="mt-3 p-2.5 rounded-xl bg-card border border-border flex items-center justify-between gap-2 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                onOpenProfile?.();
                onCloseMobile();
              }}
              className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center font-khmer shadow-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground font-khmer truncate group-hover:underline">
                  {user.name}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  {user.email}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer shrink-0"
              title={t.auth.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border bg-card text-foreground transition-colors">
        <div className="sticky top-16 h-[calc(100vh-4rem)]">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] bg-card text-foreground h-full shadow-2xl z-10 transition-transform duration-300 animate-slide-right border-r border-border">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
