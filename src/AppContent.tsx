import React, { useState } from 'react';
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

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  const handleCustomerSubmit = (
    data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setIsSubmitting(true);
    try {
      if (customerToEdit) {
        updateCustomer(customerToEdit.id, data);
        showToast(t.toasts.customerUpdated, 'success');
      } else {
        addCustomer(data);
        showToast(t.toasts.customerAdded, 'success');
      }
      setIsCustomerFormModalOpen(false);
      setCustomerToEdit(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      showToast(t.toasts.customerDeleted, 'info');
      setCustomerToDelete(null);
      if (customerToView?.id === customerToDelete.id) {
        setCustomerToView(null);
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
    setCurrentTab('customers');
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
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onOpenAddCustomer={handleOpenAddCustomer}
              onOpenAddNote={() => setCurrentTab('notes')}
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
                    setCurrentTab('customers');
                  }}
                  onCancel={() => setCurrentTab('customers')}
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
        onSelectTab={setCurrentTab}
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
