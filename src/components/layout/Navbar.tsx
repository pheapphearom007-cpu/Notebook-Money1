import React from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useCustomers } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenAddCustomer: () => void;
  onNavigateToCustomers: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  onOpenAddCustomer,
  onNavigateToCustomers,
  onOpenProfile,
}) => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { filterOptions, setSearchQuery } = useCustomers();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length > 0) {
      onNavigateToCustomers();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border text-foreground transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs shrink-0 border border-primary/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-khmer leading-none">
                    {t.appName}
                  </h1>
                  <span className="hidden sm:inline-flex text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                    {language === 'km' ? 'ប្រព័ន្ធបញ្ជី' : 'Pro'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-normal leading-tight hidden xs:block font-khmer">
                  {t.appSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={filterOptions.searchQuery}
                onChange={handleSearchChange}
                placeholder={t.customerList.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2 text-sm bg-muted hover:bg-secondary focus:bg-card text-foreground placeholder:text-muted-foreground rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none font-khmer"
              />
              {filterOptions.searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher Pill */}
            <div className="inline-flex items-center bg-muted p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setLanguage('km')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  language === 'km'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="ប្តូរទៅជា ភាសាខ្មែរ"
              >
                <span>🇰🇭</span>
                <span className="hidden sm:inline font-khmer">ខ្មែរ</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Switch to English"
              >
                <span>🇬🇧</span>
                <span className="hidden sm:inline">EN</span>
              </button>
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground bg-muted hover:bg-secondary border border-border transition-colors cursor-pointer"
              title={isDark ? t.settings.lightMode : t.settings.darkMode}
              aria-label="Toggle visual theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            {/* Quick Add Customer Button */}
            <Button
              size="sm"
              onClick={onOpenAddCustomer}
              leftIcon={<Plus className="w-4 h-4" />}
              className="hidden sm:inline-flex"
            >
              {t.nav.addCustomer}
            </Button>

            {/* User Profile Avatar Button */}
            {user && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-muted hover:bg-secondary border border-border transition-all cursor-pointer group"
                title={`${user.name} (${user.email})`}
              >
                <div className="flex flex-col text-left hidden md:block max-w-[110px]">
                  <span className="text-[11px] font-bold text-foreground font-khmer leading-none truncate">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono leading-none mt-1 truncate">
                    {user.email}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center font-khmer shadow-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
