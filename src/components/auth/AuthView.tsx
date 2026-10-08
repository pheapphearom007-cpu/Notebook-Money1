import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { AppLogo } from '../common/AppLogo';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';

export const AuthView: React.FC = () => {
  const {
    login,
    register,
    resetPasswordForEmail,
    updatePassword,
    isPasswordRecovery,
    error: authError,
    clearError,
  } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    clearError();
    setResetSuccessMessage(null);
    setFieldErrors({});
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Password Recovery Mode Validation
    if (isPasswordRecovery) {
      if (!password) {
        errs.password = t.auth.validation.passwordRequired;
      } else if (password.length < 6) {
        errs.password = t.auth.validation.passwordLength;
      }
      if (!confirmPassword) {
        errs.confirmPassword = t.auth.validation.passwordRequired;
      } else if (password !== confirmPassword) {
        errs.confirmPassword = t.auth.validation.passwordMismatch;
      }
      setFieldErrors(errs);
      return Object.keys(errs).length === 0;
    }

    // Forgot Password Mode Validation
    if (mode === 'forgot') {
      if (!email.trim()) {
        errs.email = t.auth.validation.emailRequired;
      } else if (!emailRegex.test(email.trim())) {
        errs.email = t.auth.validation.emailInvalid;
      }
      setFieldErrors(errs);
      return Object.keys(errs).length === 0;
    }

    // Sign Up Validation
    if (mode === 'signup') {
      if (!name.trim()) {
        errs.name = t.auth.validation.nameRequired;
      }
    }

    // Email
    if (!email.trim()) {
      errs.email = t.auth.validation.emailRequired;
    } else if (!emailRegex.test(email.trim())) {
      errs.email = t.auth.validation.emailInvalid;
    }

    // Password
    if (!password) {
      errs.password = t.auth.validation.passwordRequired;
    } else if (password.length < 6) {
      errs.password = t.auth.validation.passwordLength;
    }

    // Confirm password on signup
    if (mode === 'signup') {
      if (!confirmPassword) {
        errs.confirmPassword = t.auth.validation.passwordRequired;
      } else if (password !== confirmPassword) {
        errs.confirmPassword = t.auth.validation.passwordMismatch;
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setResetSuccessMessage(null);

    try {
      if (isPasswordRecovery) {
        const res = await updatePassword(password);
        if (res.success) {
          setResetSuccessMessage(t.auth.passwordResetSuccess);
        }
      } else if (mode === 'forgot') {
        const res = await resetPasswordForEmail(email.trim());
        if (res.success) {
          setResetSuccessMessage(t.auth.resetLinkSent);
        }
      } else if (mode === 'signin') {
        await login({ email: email.trim(), password });
      } else {
        await register({ name: name.trim(), email: email.trim(), password });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill demo credentials
  const handleQuickDemo = () => {
    setEmail('demo@sievphov.com');
    setPassword('password123');
    setMode('signin');
    setFieldErrors({});
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground font-sans transition-colors relative overflow-hidden select-none">
      {/* Ambient background blur elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-5xl w-full mx-auto px-4 py-4 sm:px-6 flex items-center justify-between pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <div className="flex items-center gap-2.5">
          <AppLogo size="md" alt={t.appName} />
          <span className="font-bold text-lg font-khmer text-foreground">{t.appName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="inline-flex items-center bg-muted p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setLanguage('km')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                language === 'km'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🇰🇭 ខ្មែរ
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground bg-muted hover:bg-secondary border border-border transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-card text-foreground rounded-3xl border border-border p-6 sm:p-8 shadow-xl space-y-6 animate-scale-up">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-foreground font-khmer">
              {isPasswordRecovery
                ? t.auth.newPasswordTitle
                : mode === 'forgot'
                ? t.auth.resetPasswordTitle
                : mode === 'signin'
                ? t.auth.signInTitle
                : t.auth.signUpTitle}
            </h2>
            <p className="text-xs text-muted-foreground font-khmer leading-relaxed">
              {isPasswordRecovery
                ? t.auth.newPasswordSubtitle
                : mode === 'forgot'
                ? t.auth.resetPasswordSubtitle
                : mode === 'signin'
                ? t.auth.signInSubtitle
                : t.auth.signUpSubtitle}
            </p>

            {/* Mode Switch Tabs (Only when not in forgot or recovery mode) */}
            {!isPasswordRecovery && mode !== 'forgot' && (
              <div className="grid grid-cols-2 p-1 bg-muted rounded-2xl border border-border mt-4">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`py-2 text-xs font-bold font-khmer rounded-xl transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.auth.signIn}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`py-2 text-xs font-bold font-khmer rounded-xl transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.auth.signUp}
                </button>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {resetSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-khmer flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {authError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-khmer flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {!isPasswordRecovery && mode === 'signup' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-foreground font-khmer">
                  {t.auth.fullName} <span className="text-accent font-black">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder={t.auth.fullNamePlaceholder}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border rounded-xl outline-none font-khmer text-foreground transition-all ${
                      fieldErrors.name
                        ? 'border-destructive ring-1 ring-destructive'
                        : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-destructive font-khmer flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Address (Shown except in Password Recovery mode) */}
            {!isPasswordRecovery && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-foreground font-khmer">
                  {t.auth.email} <span className="text-accent font-black">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder={t.auth.emailPlaceholder}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border rounded-xl outline-none font-mono text-foreground transition-all ${
                      fieldErrors.email
                        ? 'border-destructive ring-1 ring-destructive'
                        : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-destructive font-khmer flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            )}

            {/* Password (Shown in signin, signup, or recovery mode) */}
            {(isPasswordRecovery || mode !== 'forgot') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground font-khmer">
                    {isPasswordRecovery ? 'ពាក្យសម្ងាត់ថ្មី (New Password)' : t.auth.password}{' '}
                    <span className="text-accent font-black">*</span>
                  </label>
                  {!isPasswordRecovery && mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] text-primary hover:underline font-khmer cursor-pointer"
                    >
                      {t.auth.forgotPassword}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder={t.auth.passwordPlaceholder}
                    className={`w-full pl-10 pr-10 py-2.5 text-sm bg-background border rounded-xl outline-none font-mono text-foreground transition-all ${
                      fieldErrors.password
                        ? 'border-destructive ring-1 ring-destructive'
                        : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-destructive font-khmer flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password (Sign Up or Recovery mode) */}
            {(isPasswordRecovery || mode === 'signup') && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-foreground font-khmer">
                  {t.auth.confirmPassword} <span className="text-accent font-black">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    className={`w-full pl-10 pr-10 py-2.5 text-sm bg-background border rounded-xl outline-none font-mono text-foreground transition-all ${
                      fieldErrors.confirmPassword
                        ? 'border-destructive ring-1 ring-destructive'
                        : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-destructive font-khmer flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full justify-center py-3 text-sm font-bold shadow-md"
                rightIcon={
                  isPasswordRecovery ? (
                    <KeyRound className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )
                }
              >
                {isPasswordRecovery
                  ? t.auth.submitNewPassword
                  : mode === 'forgot'
                  ? t.auth.sendResetLink
                  : mode === 'signin'
                  ? t.auth.submitSignIn
                  : t.auth.submitSignUp}
              </Button>
            </div>

            {/* Back to sign in link for Forgot Password */}
            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-khmer cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.auth.backToSignIn}</span>
                </button>
              </div>
            )}
          </form>

          {/* Quick Demo Account Button (Only in signin mode) */}
          {mode === 'signin' && (
            <div className="pt-4 border-t border-border/60 text-center">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-muted text-xs font-semibold text-secondary-foreground border border-border transition-all cursor-pointer font-khmer"
                title={t.auth.demoNote}
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>{t.auth.guestDemo} (demo@sievphov.com)</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-muted-foreground font-khmer">
        <p>© 2026 {t.appName} — Cloud Database Architecture with Supabase & PostgreSQL RLS</p>
      </footer>
    </div>
  );
};
