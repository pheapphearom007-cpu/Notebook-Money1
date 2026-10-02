import React from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  StickyNote,
  FileSpreadsheet,
  ArrowRight,
  Phone,
  Eye,
  DollarSign,
} from 'lucide-react';
import { StatCard } from './StatCard';
import { StatusBadge, CategoryBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomers } from '../../context/CustomerContext';
import { Customer } from '../../types/customer';
import { NavTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAddCustomer: () => void;
  onOpenAddNote: () => void;
  onViewCustomer: (customer: Customer) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddCustomer,
  onOpenAddNote,
  onViewCustomer,
}) => {
  const { t } = useLanguage();
  const { stats, exportCsv } = useCustomers();

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const getInitials = (name: string) => {
    if (!name) return 'អ';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner using ROM LATEX Primary */}
      <div className="relative overflow-hidden rounded-3xl bg-primary border border-primary/30 text-primary-foreground p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-foreground/15 border border-primary-foreground/20 text-primary-foreground backdrop-blur-xs mb-3 font-khmer">
              <span>🇰🇭</span>
              <span>{t.appSubtitle}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-khmer text-primary-foreground">
              {t.dashboard.title}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-primary-foreground/80 leading-relaxed font-khmer">
              {t.dashboard.subtitle}
            </p>
          </div>

          {/* Quick Add CTA Buttons inside banner */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              size="md"
              variant="secondary"
              onClick={onOpenAddCustomer}
              leftIcon={<Plus className="w-4 h-4 text-primary" />}
              className="bg-primary-foreground text-primary hover:bg-white font-bold shadow-xs border-0"
            >
              {t.dashboard.addNewCustomer}
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={onOpenAddNote}
              leftIcon={<StickyNote className="w-4 h-4 text-primary-foreground" />}
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              {t.dashboard.addNewNote}
            </Button>
          </div>
        </div>

        {/* Minimal atmospheric background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={t.dashboard.totalCustomers}
          value={stats.totalCustomers}
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-muted"
          iconTextColor="text-primary"
          trendText={`${stats.activeCustomers} ${t.status.active}`}
          trendPositive={true}
          onClick={() => onNavigate('customers')}
        />

        <StatCard
          title={t.dashboard.todayNotes}
          value={stats.todayNotes}
          icon={<Calendar className="w-6 h-6" />}
          iconBgColor="bg-muted"
          iconTextColor="text-accent"
          subtitle={new Date().toLocaleDateString('km-KH', { dateStyle: 'medium' })}
          onClick={() => onNavigate('notes')}
        />

        <StatCard
          title={t.dashboard.activeCustomers}
          value={stats.activeCustomers}
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconBgColor="bg-muted"
          iconTextColor="text-[var(--success)]"
          subtitle={`${Math.round(
            stats.totalCustomers > 0 ? (stats.activeCustomers / stats.totalCustomers) * 100 : 0
          )}% នៃអតិថិជនសរុប`}
          onClick={() => onNavigate('customers')}
        />

        <StatCard
          title={t.dashboard.pendingCustomers}
          value={stats.pendingCustomers}
          icon={<Clock className="w-6 h-6" />}
          iconBgColor="bg-muted"
          iconTextColor="text-[var(--warning)]"
          subtitle={`${stats.completedCustomers} ${t.status.completed}`}
          onClick={() => onNavigate('customers')}
        />
      </div>

      {/* Quick Status and Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Customers */}
        <div className="lg:col-span-2 bg-card text-foreground rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground font-khmer">
                  {t.dashboard.recentCustomers}
                </h3>
                <p className="text-xs text-muted-foreground font-khmer mt-0.5">
                  {t.dashboard.subtitle}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('customers')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="text-foreground hover:bg-muted"
              >
                {t.dashboard.viewAllCustomers}
              </Button>
            </div>

            {/* Customer List items */}
            <div className="divide-y divide-border/60">
              {stats.recentCustomers.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm font-khmer">
                  {t.dashboard.noRecentCustomers}
                </div>
              ) : (
                stats.recentCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-muted px-2 rounded-xl transition-colors cursor-pointer group"
                    onClick={() => onViewCustomer(customer)}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary border border-border text-foreground flex items-center justify-center font-bold text-sm shrink-0 font-khmer">
                        {getInitials(customer.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground truncate font-khmer group-hover:text-primary transition-colors">
                            {customer.name}
                          </h4>
                          <StatusBadge status={customer.status} size="sm" />
                          {customer.category && (
                            <CategoryBadge category={customer.category} size="sm" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-khmer">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {customer.phone}
                          </span>
                          {customer.province && (
                            <span className="hidden sm:inline truncate">
                              • {customer.province}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground font-mono hidden md:inline">
                        {customer.date}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCustomer(customer);
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                        title={t.common.view}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-khmer">
              {t.common.total}: <strong className="text-foreground">{stats.totalCustomers}</strong>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={exportCsv}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-muted-foreground" />}
            >
              {t.settings.exportCSV}
            </Button>
          </div>
        </div>

        {/* Right Column: Status Breakdown & Recent Notes */}
        <div className="space-y-6">
          {/* Status Breakdown card */}
          <div className="bg-card text-foreground rounded-2xl border border-border p-5 sm:p-6 shadow-xs">
            <h3 className="text-base font-bold text-foreground font-khmer mb-4">
              {t.dashboard.statusBreakdown}
            </h3>
            <div className="space-y-3">
              {/* Active */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground font-khmer flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {t.status.active}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {stats.activeCustomers}
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats.totalCustomers > 0
                          ? (stats.activeCustomers / stats.totalCustomers) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Pending */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground font-khmer flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--warning)]" />
                    {t.status.pending}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {stats.pendingCustomers}
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--warning)] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats.totalCustomers > 0
                          ? (stats.pendingCustomers / stats.totalCustomers) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Debt */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground font-khmer flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--destructive)]" />
                    {t.status.debt}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {stats.debtCustomers}
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--destructive)] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats.totalCustomers > 0
                          ? (stats.debtCustomers / stats.totalCustomers) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Completed */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground font-khmer flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                    {t.status.completed}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {stats.completedCustomers}
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--success)] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats.totalCustomers > 0
                          ? (stats.completedCustomers / stats.totalCustomers) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Inactive */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-muted-foreground font-khmer flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    {t.status.inactive}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {stats.inactiveCustomers}
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-muted-foreground h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats.totalCustomers > 0
                          ? (stats.inactiveCustomers / stats.totalCustomers) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Total Balance / Ledger Card */}
            <div className="mt-5 p-3.5 rounded-xl bg-muted border border-border flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground font-khmer">
                  {t.dashboard.ledgerBalance}
                </span>
                <p className="text-lg font-extrabold text-foreground mt-0.5 font-mono">
                  {formatAmount(stats.totalBalance)}
                </p>
              </div>
              <DollarSign className="w-6 h-6 text-accent" />
            </div>
          </div>

          {/* Recently Updated Notes Mini Card */}
          <div className="bg-card text-foreground rounded-2xl border border-border p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground font-khmer">
                {t.dashboard.recentlyUpdatedNotes}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('notes')}
                className="text-xs text-foreground hover:bg-muted"
              >
                {t.common.all}
              </Button>
            </div>

            <div className="space-y-2.5">
              {stats.recentlyUpdatedNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-khmer">
                  {t.dashboard.noRecentNotes}
                </p>
              ) : (
                stats.recentlyUpdatedNotes.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onNavigate('notes')}
                    className="p-3 rounded-xl bg-muted hover:bg-secondary cursor-pointer transition-colors border border-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-xs font-bold text-foreground truncate font-khmer">
                        {note.title}
                      </h5>
                      {note.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-card text-muted-foreground font-khmer border border-border">
                          {note.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-khmer">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
