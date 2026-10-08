import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Customer } from './types/customer';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomerListView } from './components/customers/CustomerListView';
import { CustomerForm } from './components/customers/CustomerForm';
import { CustomerDetailModal } from './components/customers/CustomerDetailModal';
import { NotesView } from './components/notes/NotesView';
import { SettingsView } from './components/settings/SettingsView';
import { Modal } from './components/common/Modal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { LoadingScreen } from './components/common/LoadingScreen';
import { AuthView } from './components/auth/AuthView';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { useLanguage } from './context/LanguageContext';
import { useCustomers } from './context/CustomerContext';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';

const VALID_TABS: NavTab[] = ['dashboard', 'customers', 'add-customer', 'notes', 'settings'];
const TAB_STORAGE_KEY = 'sievphov_active_tab';

const getInitialTab = (): NavTab => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '').toLowerCase() as NavTab;
    if (VALID_TABS.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem(TAB_STORAGE_KEY) as NavTab | null;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  }
  return 'dashboard';
};

export const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    customers,
    isDataLoading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers();
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<NavTab>(getInitialTab);
  const [tabHistory, setTabHistory] = useState<NavTab[]>(() => [getInitialTab()]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Synchronize URL hash and browser back/forward navigation with current tab
  useEffect(() => {
    const syncFromLocation = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase() as NavTab;
      if (VALID_TABS.includes(hash)) {
        setCurrentTab(hash);
        localStorage.setItem(TAB_STORAGE_KEY, hash);
      } else if (!window.location.hash || window.location.hash === '#') {
        const saved = (localStorage.getItem(TAB_STORAGE_KEY) as NavTab) || 'dashboard';
        if (VALID_TABS.includes(saved)) {
          setCurrentTab(saved);
        }
      }
    };

    if (typeof window !== 'undefined') {
      const initial = getInitialTab();
      if (!window.location.hash || window.location.hash === '#') {
        window.history.replaceState(null, '', `#${initial}`);
      }
      window.addEventListener('hashchange', syncFromLocation);
      window.addEventListener('popstate', syncFromLocation);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', syncFromLocation);
        window.removeEventListener('popstate', syncFromLocation);
      }
    };
  }, []);

  // Navigate to tab and maintain navigation history stack & URL hash
  const handleSelectTab = useCallback((newTab: NavTab) => {
    setCurrentTab((prevTab) => {
      if (prevTab !== newTab) {
        setTabHistory((prev) => [...prev, newTab]);
      }
      return newTab;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(TAB_STORAGE_KEY, newTab);
      const targetHash = `#${newTab}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }, []);

  // Back button handler: pops previous tab or falls back to dashboard / browser back
  const handleGoBack = useCallback(() => {
    setTabHistory((prev) => {
      if (prev.length > 1) {
        const nextHistory = [...prev];
        nextHistory.pop(); // remove current tab
        const previousTab = nextHistory[nextHistory.length - 1];
        setCurrentTab(previousTab);
        if (typeof window !== 'undefined') {
          localStorage.setItem(TAB_STORAGE_KEY, previousTab);
          window.location.hash = `#${previousTab}`;
        }
        return nextHistory;
      }
      // If at root of history
      if (currentTab !== 'dashboard') {
        setCurrentTab('dashboard');
        if (typeof window !== 'undefined') {
          localStorage.setItem(TAB_STORAGE_KEY, 'dashboard');
          window.location.hash = '#dashboard';
        }
      } else if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      }
      return prev;
    });
  }, [currentTab]);

  // Customer Modals
  const [isCustomerFormModalOpen, setIsCustomerFormModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToView, setCustomerToView] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Overall coordinated loading state
  const isAppLoading = isAuthLoading || (isAuthenticated && isDataLoading);

  // Quick action openers
  const handleOpenAddCustomer = () => {
    setCustomerToEdit(null);
    setIsCustomerFormModalOpen(true);
  };

  const handleOpenEditCustomer = (customer: Customer) => {
    setCustomerToView(null);
    setCustomerToEdit(customer);
    setIsCustomerFormModalOpen(true);
  };

  const handleOpenViewCustomer = (customer: Customer) => {
    setCustomerToView(customer);
  };

  const handleCustomerSubmit = async (
    data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setIsSubmitting(true);
    try {
      if (customerToEdit) {
        await updateCustomer(customerToEdit.id, data);
        showToast(t.toasts.customerUpdated, 'success');
      } else {
        await addCustomer(data);
        showToast(t.toasts.customerAdded, 'success');
      }
      setIsCustomerFormModalOpen(false);
      setCustomerToEdit(null);
    } catch (err: any) {
      showToast(`កំហុសក្នុងការរក្សាទុក: ${err.message || 'បរាជ័យ'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (customerToDelete) {
      try {
        await deleteCustomer(customerToDelete.id);
        showToast(t.toasts.customerDeleted, 'info');
        setCustomerToDelete(null);
        if (customerToView?.id === customerToDelete.id) {
          setCustomerToView(null);
        }
      } catch (err: any) {
        showToast(`កំហុសក្នុងការលុប: ${err.message || 'បរាជ័យ'}`, 'error');
      }
    }
  };

  const handleViewCustomerById = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setCustomerToView(cust);
    }
  };

  const handleNavigateToCustomers = () => {
    handleSelectTab('customers');
  };

  // If unauthenticated, show AuthView with LoadingScreen on top while checking
  if (!isAuthenticated) {
    return (
      <>
        <LoadingScreen isLoading={isAppLoading} />
        {!isAuthLoading && <AuthView />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground transition-colors">
      {/* Full-screen Loading Screen */}
      <LoadingScreen isLoading={isAppLoading} />

      {/* Top Navbar */}
      <Navbar
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAddCustomer={handleOpenAddCustomer}
        onNavigateToCustomers={handleNavigateToCustomers}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Main Workspace Area with bottom padding for mobile BottomNav */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0 pb-28 lg:pb-8">
          {/* Top-Left Back Button (shown on all pages except the home page) */}
          {currentTab !== 'dashboard' && (
            <div className="mb-4 sm:mb-6">
              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-khmer text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group active:scale-95"
                title={t.common.back}
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <span>{t.common.back}</span>
              </button>
            </div>
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={handleSelectTab}
              onOpenAddCustomer={handleOpenAddCustomer}
              onOpenAddNote={() => handleSelectTab('notes')}
              onViewCustomer={handleOpenViewCustomer}
            />
          )}

          {currentTab === 'customers' && (
            <CustomerListView
              onOpenAddCustomer={handleOpenAddCustomer}
              onViewCustomer={handleOpenViewCustomer}
              onEditCustomer={handleOpenEditCustomer}
              onDeleteCustomer={(c) => setCustomerToDelete(c)}
            />
          )}

          {currentTab === 'add-customer' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-khmer">
                    {t.customerForm.addTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-khmer mt-0.5">
                    {t.appSubtitle}
                  </p>
                </div>
              </div>
              <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs">
                <CustomerForm
                  onSubmit={(data) => {
                    handleCustomerSubmit(data);
                    handleSelectTab('customers');
                  }}
                  onCancel={() => handleSelectTab('customers')}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          )}

          {currentTab === 'notes' && (
            <NotesView onViewCustomerById={handleViewCustomerById} />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAddCustomer={handleOpenAddCustomer}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Customer Form Modal (Add / Edit) */}
      <Modal
        isOpen={isCustomerFormModalOpen}
        onClose={() => setIsCustomerFormModalOpen(false)}
        title={customerToEdit ? t.customerForm.editTitle : t.customerForm.addTitle}
        subtitle={customerToEdit ? `ID: ${customerToEdit.id}` : t.appSubtitle}
        maxWidth="2xl"
      >
        <CustomerForm
          initialData={customerToEdit}
          onSubmit={handleCustomerSubmit}
          onCancel={() => setIsCustomerFormModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        customer={customerToView}
        isOpen={Boolean(customerToView)}
        onClose={() => setCustomerToView(null)}
        onEdit={handleOpenEditCustomer}
        onDelete={(c) => {
          setCustomerToDelete(c);
        }}
      />

      {/* Delete Customer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleConfirmDeleteCustomer}
        title={t.dialogs.deleteCustomerTitle}
        message={t.dialogs.deleteCustomerConfirm.replace(
          '{name}',
          customerToDelete?.name || ''
        )}
        isDanger={true}
      />
    </div>
  );
};
