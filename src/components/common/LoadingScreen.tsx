import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { useLanguage } from '../../context/LanguageContext';

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const { t } = useLanguage();
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsFadingOut(false);
      }, 350); // Matches smooth fade-out duration
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
      setIsFadingOut(false);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground transition-opacity duration-350 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Loading application"
    >
      {/* Ambient background blur circles */}
      <div className="absolute w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none -bottom-10 -right-10" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full animate-fade-in">
        {/* Brand Logo Emblem with Pulse */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-40 animate-pulse" />
          <AppLogo size="xl" className="relative shadow-lg hover:scale-105" alt={t.appName || 'សៀវភៅបញ្ជី'} />
        </div>

        {/* Brand App Name */}
        <h1 className="text-2xl font-black tracking-tight text-foreground font-khmer">
          {t.appName || 'សៀវភៅបញ្ជី'}
        </h1>
        <p className="text-xs text-muted-foreground font-khmer mt-1 tracking-wide">
          {t.appSubtitle || 'ប្រព័ន្ធកត់ត្រាព័ត៌មានអតិថិជន និងកំណត់ចំណាំ'}
        </p>

        {/* Minimalist Progress Bar */}
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-7 border border-border/50">
          <div className="h-full bg-primary rounded-full animate-[progress_1.2s_ease-in-out_infinite]" />
        </div>

        {/* Status text */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground font-khmer font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>{t.auth?.initializingSession || 'កំពុងរៀបចំប្រព័ន្ធ និងសមកាលកម្មទិន្នន័យ...'}</span>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% {
            width: 0%;
            transform: translateX(0%);
          }
          50% {
            width: 75%;
            transform: translateX(15%);
          }
          100% {
            width: 100%;
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};
