import React, { useRef, useState } from 'react';
import {
  Globe,
  Sun,
  Moon,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  HardDrive,
  Info,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  RefreshCw,
  Database,
  Server,
  Smartphone,
  Laptop,
  Key,
} from 'lucide-react';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useCustomers } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storage';
import { isSupabaseConfigured, configureSupabaseCredentials } from '../../services/supabaseClient';

export const SettingsView: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { user, logout, syncStatus } = useAuth();
  const {
    customers,
    notes,
    exportJson,
    exportCsv,
    importJson,
    resetToSample,
    clearAll,
    refreshData,
  } = useCustomers();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Supabase Custom Config State
  const [isSupabaseFormOpen, setIsSupabaseFormOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('sievphov_supabase_url') || '' : ''
  );
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('sievphov_supabase_key') || '' : ''
  );

  const isSupabaseActive = isSupabaseConfigured();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importJson(file);
    if (result.success) {
      showToast(
        `${t.toasts.dataImported} (${result.customerCount} អតិថិជន, ${result.noteCount} កំណត់ចំណាំ)`,
        'success'
      );
    } else {
      showToast(`${t.toasts.dataImportError}: ${result.error}`, 'error');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmReset = () => {
    resetToSample();
    showToast(t.toasts.dataReset, 'success');
  };

  const handleConfirmClear = () => {
    clearAll();
    showToast(t.toasts.dataCleared, 'info');
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await refreshData();
      showToast(t.auth.syncSuccess || 'ធ្វើសមកាលកម្មទិន្នន័យបានជោគជ័យ!', 'success');
    } catch {
      showToast('បរាជ័យក្នុងការធ្វើសមកាលកម្ម', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      showToast('សូមបញ្ចូល Supabase Project URL និង Anon Key ឱ្យបានត្រឹមត្រូវ', 'error');
      return;
    }

    configureSupabaseCredentials(supabaseUrlInput.trim(), supabaseKeyInput.trim());
    showToast('បានរក្សាទុកការកំណត់ Supabase Cloud! កំពុងផ្ទុកទិន្នន័យ...', 'success');
    setIsSupabaseFormOpen(false);
    await refreshData();
  };

  const handleDisconnectSupabase = async () => {
    configureSupabaseCredentials('', '');
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    showToast('បានផ្តាច់ពី Supabase។ ត្រឡប់មកប្រើ Server API ផ្ទាល់ខ្លួន', 'info');
    setIsSupabaseFormOpen(false);
    await refreshData();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-khmer">
          {t.settings.title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-khmer mt-0.5">
          {t.settings.subtitle}
        </p>
      </div>

      {/* 0. Customer Account Area */}
      {user && (
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs relative overflow-hidden">
          {/* Subtle watermark */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-sm shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    {user.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                    {user.id}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {user.email}
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground font-khmer">
                  <span>{t.auth.customersCount}: <strong className="text-foreground font-sans">{customers.length}</strong></span>
                  <span>•</span>
                  <span>{t.auth.notesCount}: <strong className="text-foreground font-sans">{notes.length}</strong></span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-destructive'}`} />
                    {syncStatus === 'synced' ? (t.auth.cloudSynced || 'បានធ្វើសមកាលកម្ម') : syncStatus === 'syncing' ? (t.auth.syncing || 'កំពុងសមកាលកម្ម...') : (t.auth.offlineMode || 'ក្រៅបណ្តាញ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                isLoading={isSyncing}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
                className="w-full sm:w-auto py-2.5"
              >
                {t.auth.syncNow || 'ធ្វើសមកាលកម្មឥឡូវ'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLogoutConfirmOpen(true)}
                leftIcon={<LogOut className="w-3.5 h-3.5 text-destructive" />}
                className="hover:border-destructive hover:text-destructive w-full sm:w-auto py-2.5"
              >
                {t.auth.signOut}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Language Preference Section */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-muted text-foreground border border-border flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground font-khmer">
              {t.settings.languageSection}
            </h3>
            <p className="text-xs text-muted-foreground font-khmer mt-1">
              {t.settings.languageDesc}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setLanguage('km')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  language === 'km'
                    ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🇰🇭</span>
                  <div>
                    <h5 className="text-sm font-bold font-khmer">ភាសាខ្មែរ (Khmer)</h5>
                    <p className="text-[11px] text-muted-foreground font-khmer">ភាសាលំនាំដើម</p>
                  </div>
                </div>
                {language === 'km' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  language === 'en'
                    ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🇬🇧</span>
                  <div>
                    <h5 className="text-sm font-bold">English</h5>
                    <p className="text-[11px] text-muted-foreground">Secondary language</p>
                  </div>
                </div>
                {language === 'en' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Appearance Section */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-muted text-foreground border border-border flex items-center justify-center shrink-0">
            {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground font-khmer">
              {t.settings.appearanceSection}
            </h3>
            <p className="text-xs text-muted-foreground font-khmer mt-1">
              {t.settings.appearanceDesc}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Button
                variant={!isDark ? 'primary' : 'outline'}
                size="sm"
                onClick={() => isDark && toggleTheme()}
                leftIcon={<Sun className="w-4 h-4" />}
              >
                {t.settings.lightMode}
              </Button>
              <Button
                variant={isDark ? 'primary' : 'outline'}
                size="sm"
                onClick={() => !isDark && toggleTheme()}
                leftIcon={<Moon className="w-4 h-4" />}
              >
                {t.settings.darkMode}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Centralized Cloud Database & Synchronization */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground font-khmer">
                  {t.auth.cloudDataTitle || 'ទិន្នន័យក្លោដ និងការសមកាលកម្ម'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isSupabaseActive ? 'Supabase Active' : 'Central Server Active'}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Laptop className="w-3.5 h-3.5" />
                <Smartphone className="w-3.5 h-3.5" />
                <span className="font-khmer">{t.auth.multiDeviceSupported || 'គាំទ្រច្រើនឧបករណ៍'}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-khmer mt-1.5 leading-relaxed">
              {isSupabaseActive
                ? 'ទិន្នន័យត្រូវបានភ្ជាប់ទៅកាន់ Supabase Cloud Database (PostgreSQL) ជាមួយសុវត្ថិភាព Row Level Security (RLS) ដាច់ដោយឡែកតាមគណនីនីមួយៗ។'
                : 'ទិន្នន័យត្រូវបានរក្សាទុកនៅលើម៉ាស៊ីនបម្រើកណ្តាល (Central Server Cloud API)។ រាល់ការកែប្រែត្រូវបានសមកាលកម្មភ្លាមៗទៅគ្រប់ឧបករណ៍ (កុំព្យូទ័រ ទូរស័ព្ទ ថេប្លេត)។'}
            </p>

            {/* Architecture Details */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                <Database className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    {isSupabaseActive ? 'PostgreSQL + Supabase Cloud' : 'Central Server Storage API'}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-khmer">
                    ឯកោទិន្នន័យតាមរយៈ user_id
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                <Server className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    Local Cache Vault
                  </p>
                  <p className="text-[11px] text-muted-foreground font-khmer">
                    បម្រុងទុកទិន្នន័យពេលគ្មានអ៊ីនធឺណិត
                  </p>
                </div>
              </div>
            </div>

            {/* Supabase Custom Credentials Form Accordion */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground font-khmer">
                  {isSupabaseActive ? 'កំណត់រចនាសម្ព័ន្ធ Supabase ដោយផ្ទាល់' : 'តភ្ជាប់ទៅ Supabase ផ្ទាល់ខ្លួន (ស្រេចចិត្ត)'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSupabaseFormOpen(!isSupabaseFormOpen)}
                  className="text-xs text-primary underline font-khmer cursor-pointer"
                >
                  {isSupabaseFormOpen ? 'បិទ' : (isSupabaseActive ? 'មើលការកំណត់' : 'ភ្ជាប់ Supabase')}
                </button>
              </div>

              {isSupabaseFormOpen && (
                <form onSubmit={handleSaveSupabase} className="mt-3 p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="url"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      placeholder="https://your-project-ref.supabase.co"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Supabase Anon Public API Key
                    </label>
                    <input
                      type="password"
                      value={supabaseKeyInput}
                      onChange={(e) => setSupabaseKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground font-khmer">
                    * ចំណាំ៖ កូដ SQL សម្រាប់បង្កើតតារាង និង RLS មានស្រាប់ក្នុងឯកសារ <code className="font-mono text-[10px] bg-secondary px-1 py-0.5 rounded">supabase_schema.sql</code>។
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <Button type="submit" size="sm" variant="primary" leftIcon={<Key className="w-3.5 h-3.5" />}>
                      រក្សាទុក & តភ្ជាប់
                    </Button>
                    {isSupabaseActive && (
                      <Button type="button" size="sm" variant="outline" onClick={handleDisconnectSupabase}>
                        ផ្តាច់ Supabase
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Data Persistence & Backup Section */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-muted text-foreground border border-border flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-foreground font-khmer">
                {t.settings.dataSection}
              </h3>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                {t.settings.storageUsed}: {StorageService.getStorageUsage()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-khmer mt-1">
              {t.settings.dataDesc}
            </p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border">
          {/* Export JSON */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground font-khmer">
                {t.settings.exportJSON}
              </h4>
              <p className="text-xs text-muted-foreground font-khmer mt-1 leading-relaxed">
                {t.settings.exportJSONDesc}
              </p>
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={exportJson}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download JSON
              </Button>
            </div>
          </div>

          {/* Export CSV / Excel */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground font-khmer">
                {t.settings.exportCSV}
              </h4>
              <p className="text-xs text-muted-foreground font-khmer mt-1 leading-relaxed">
                {t.settings.exportCSVDesc}
              </p>
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />}
              >
                Excel / CSV (Khmer)
              </Button>
            </div>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground font-khmer">
                {t.settings.importJSON}
              </h4>
              <p className="text-xs text-muted-foreground font-khmer mt-1 leading-relaxed">
                {t.settings.importJSONDesc}
              </p>
            </div>
            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Restore JSON
              </Button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground font-khmer">
                {t.settings.resetSample}
              </h4>
              <p className="text-xs text-muted-foreground font-khmer mt-1 leading-relaxed">
                {t.settings.resetSampleDesc}
              </p>
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetConfirmOpen(true)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />}
              >
                Reset Demo
              </Button>
            </div>
          </div>
        </div>

        {/* High Risk Clear All Action */}
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h5 className="text-xs font-bold text-foreground font-khmer">
              {t.settings.clearAll}
            </h5>
            <p className="text-[11px] text-muted-foreground font-khmer">
              {t.settings.clearAllDesc}
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsClearConfirmOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            {t.common.clear}
          </Button>
        </div>
      </div>

      {/* 5. About App Section */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 border border-border">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground font-khmer">
                {t.settings.aboutSection}
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                {t.settings.version} 1.0.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-khmer mt-2 leading-relaxed">
              {t.settings.aboutText}
            </p>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title={t.dialogs.resetDataTitle}
        message={t.dialogs.resetDataConfirm}
        isDanger={false}
      />

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleConfirmClear}
        title={t.dialogs.clearAllTitle}
        message={t.dialogs.clearAllConfirm}
        isDanger={true}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={logout}
        title={t.auth.signOutConfirmTitle || 'ចាកចេញពីគណនី'}
        message={t.auth.signOutConfirm || 'តើអ្នកប្រាកដជាចង់ចាកចេញពីគណនីរបស់អ្នកមែនទេ?'}
        isDanger={false}
      />
    </div>
  );
};
