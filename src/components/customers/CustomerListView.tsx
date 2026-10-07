import React, { useState } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Users,
  X,
} from 'lucide-react';
import { Customer, CustomerStatus, CustomerCategory, SortField } from '../../types/customer';
import { CustomerTable } from './CustomerTable';
import { CustomerCard } from './CustomerCard';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomers } from '../../context/CustomerContext';
import { CAMBODIAN_PROVINCES, CAMBODIAN_VILLAGES } from '../../services/sampleData';

interface CustomerListViewProps {
  onOpenAddCustomer: () => void;
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  onOpenAddCustomer,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
}) => {
  const { t, isKhmer } = useLanguage();
  const {
    filteredCustomers,
    customers,
    filterOptions,
    setSearchQuery,
    setStatusFilter,
    setCategoryFilter,
    setProvinceFilter,
    setVillageFilter,
    setSortBy,
    resetFilters,
    exportCsv,
  } = useCustomers();

  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');

  const statusTabs: { id: CustomerStatus | 'all'; label: string }[] = [
    { id: 'all', label: t.common.all },
    { id: 'active', label: t.status.active },
    { id: 'pending', label: t.status.pending },
    { id: 'debt', label: t.status.debt },
    { id: 'completed', label: t.status.completed },
    { id: 'inactive', label: t.status.inactive },
  ];

  const categories: { id: CustomerCategory | 'all'; label: string }[] = [
    { id: 'all', label: t.categories.all },
    { id: 'vip', label: t.categories.vip },
    { id: 'wholesale', label: t.categories.wholesale },
    { id: 'retail', label: t.categories.retail },
    { id: 'service', label: t.categories.service },
    { id: 'online', label: t.categories.online },
  ];

  const sortOptions: { id: SortField; label: string }[] = [
    { id: 'date', label: t.customerList.sortLatest },
    { id: 'name', label: t.customerList.sortNameAZ },
    { id: 'balance', label: t.customerList.sortBalance },
    { id: 'updatedAt', label: t.customerDetail.updatedAt },
  ];

  const hasActiveFilters =
    filterOptions.searchQuery !== '' ||
    filterOptions.status !== 'all' ||
    filterOptions.category !== 'all' ||
    filterOptions.province !== 'all' ||
    (filterOptions.village !== undefined && filterOptions.village !== 'all');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title & Top Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-khmer">
            {t.customerList.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-khmer mt-0.5">
            {t.customerList.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={exportCsv}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-muted-foreground" />}
          >
            {t.common.export}
          </Button>

          <Button
            size="sm"
            onClick={onOpenAddCustomer}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t.nav.addCustomer}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-card text-foreground rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-4">
        {/* Row 1: Search & Sort & View Mode */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filterOptions.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.customerList.searchPlaceholder}
              className="w-full pl-10 pr-9 py-2 text-sm bg-muted border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground outline-none font-khmer"
            />
            {filterOptions.searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls: Category, Village, Province, Sort (2x2 grid on mobile, inline on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:flex-wrap gap-2 sm:gap-2.5">
            {/* Category Dropdown */}
            <select
              value={filterOptions.category}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full sm:w-auto px-2.5 py-2 text-xs font-semibold rounded-xl bg-muted border border-border text-foreground outline-none focus:border-primary font-khmer cursor-pointer truncate"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Village Dropdown */}
            <select
              value={filterOptions.village || 'all'}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-2 text-xs font-semibold rounded-xl bg-muted border border-border text-foreground outline-none focus:border-primary font-khmer sm:max-w-[140px] truncate cursor-pointer"
            >
              <option value="all">{t.customerList.filterByVillage}: {t.common.all}</option>
              {CAMBODIAN_VILLAGES.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.num}. {v.name}
                </option>
              ))}
            </select>

            {/* Province Dropdown */}
            <select
              value={filterOptions.province}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-2 text-xs font-semibold rounded-xl bg-muted border border-border text-foreground outline-none focus:border-primary font-khmer sm:max-w-[140px] truncate cursor-pointer"
            >
              <option value="all">{t.customerList.filterByProvince}: {t.common.all}</option>
              {CAMBODIAN_PROVINCES.map((prov) => (
                <option key={prov.km} value={prov.km}>
                  {isKhmer ? prov.km : prov.en}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={filterOptions.sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="w-full sm:w-auto px-2.5 py-2 text-xs font-semibold rounded-xl bg-muted border border-border text-foreground outline-none focus:border-primary font-khmer cursor-pointer truncate"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div className="hidden sm:inline-flex items-center bg-muted p-0.5 rounded-xl border border-border">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' || viewMode === 'auto'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Status Tabs Filter */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 touch-scroll-x pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
            {statusTabs.map((tab) => {
              const count =
                tab.id === 'all'
                  ? customers.length
                  : customers.filter((c) => c.status === tab.id).length;
              const isActive = filterOptions.status === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-khmer whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted text-muted-foreground hover:bg-secondary border border-border/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-card text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-primary hover:underline font-khmer shrink-0 font-semibold cursor-pointer"
            >
              {t.common.reset}
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-khmer px-1">
        <span>
          {t.customerList.showingResults}{' '}
          <strong className="text-foreground font-mono">
            {filteredCustomers.length}
          </strong>{' '}
          / {customers.length} {t.nav.customers}
        </span>
      </div>

      {/* Main Content: Table or Cards or Empty State */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-[#545454]" />}
          title={
            hasActiveFilters
              ? t.customerList.noSearchMatch
              : t.customerList.emptyTitle
          }
          description={
            hasActiveFilters
              ? t.customerList.noSearchMatchDesc
              : t.customerList.emptyDescription
          }
          actionText={
            hasActiveFilters ? t.common.reset : t.dashboard.addNewCustomer
          }
          onAction={hasActiveFilters ? resetFilters : onOpenAddCustomer}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <>
          <div
            className={
              viewMode === 'cards'
                ? 'block'
                : viewMode === 'table'
                ? 'hidden'
                : 'lg:hidden'
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onView={onViewCustomer}
                  onEdit={onEditCustomer}
                  onDelete={onDeleteCustomer}
                />
              ))}
            </div>
          </div>

          <div
            className={
              viewMode === 'table'
                ? 'block'
                : viewMode === 'cards'
                ? 'hidden'
                : 'hidden lg:block'
            }
          >
            <CustomerTable
              customers={filteredCustomers}
              onView={onViewCustomer}
              onEdit={onEditCustomer}
              onDelete={onDeleteCustomer}
            />
          </div>
        </>
      )}
    </div>
  );
};
