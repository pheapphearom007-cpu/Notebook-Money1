import React from 'react';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Key,
  Cloud,
  LogOut,
  Users,
  StickyNote,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useCustomers } from '../../context/CustomerContext';
import { useLanguage } from '../../context/LanguageContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, syncStatus } = useAuth();
  const { customers, notes } = useCustomers();
  const { t } = useLanguage();

  if (!user) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('km-KH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.auth.profile}
      subtitle={t.auth.myAccount}
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* User Avatar & Header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted border border-border">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center shadow-xs shrink-0 font-khmer border border-primary/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-foreground font-khmer truncate">
              {user.name}
            </h4>
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
              {user.email}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-card border border-border font-khmer">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>{syncStatus === 'synced' ? t.auth.synced : syncStatus === 'syncing' ? t.auth.syncing : t.auth.offline}</span>
            </div>
          </div>
        </div>

        {/* Account Details List */}
        <div className="space-y-3 text-xs">
          {/* User ID */}
          <div className="p-3.5 rounded-xl bg-muted border border-border flex items-center justify-between">
            <span className="text-muted-foreground font-khmer flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              {t.auth.userId}:
            </span>
            <span className="font-mono font-bold text-foreground text-[11px] select-all">
              {user.id}
            </span>
          </div>

          {/* Member Since */}
          <div className="p-3.5 rounded-xl bg-muted border border-border flex items-center justify-between">
            <span className="text-muted-foreground font-khmer flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {t.auth.memberSince}:
            </span>
            <span className="font-khmer font-bold text-foreground">
              {formattedDate}
            </span>
          </div>

          {/* Cloud Database Isolation */}
          <div className="p-3.5 rounded-xl bg-muted border border-border flex items-center justify-between">
            <span className="text-muted-foreground font-khmer flex items-center gap-2">
              <Cloud className="w-4 h-4 text-muted-foreground" />
              {t.auth.cloudStatus}:
            </span>
            <span className="font-semibold text-accent font-khmer flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Isolated & Encrypted
            </span>
          </div>
        </div>

        {/* User's Records Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-muted border border-border text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-khmer">
              <Users className="w-3.5 h-3.5" />
              <span>{t.nav.customers}</span>
            </div>
            <p className="text-xl font-black font-mono text-foreground mt-1">
              {customers.length}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted border border-border text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-khmer">
              <StickyNote className="w-3.5 h-3.5" />
              <span>{t.nav.notes}</span>
            </div>
            <p className="text-xl font-black font-mono text-foreground mt-1">
              {notes.length}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2.5 sm:gap-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto py-2.5 active:scale-95">
            {t.common.close}
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="w-full sm:w-auto py-2.5 active:scale-95 font-bold"
          >
            {t.auth.logout}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
