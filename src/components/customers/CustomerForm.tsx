import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Send,
  Mail,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Customer, CustomerStatus, CustomerCategory, CustomerPriority } from '../../types/customer';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { CAMBODIAN_PROVINCES, CAMBODIAN_VILLAGES } from '../../services/sampleData';

interface CustomerFormProps {
  initialData?: Customer | null;
  onSubmit: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { t, isKhmer } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const [province, setProvince] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('active');
  const [category, setCategory] = useState<CustomerCategory>('general');
  const [priority, setPriority] = useState<CustomerPriority>('medium');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState<string>('0');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPhone(initialData.phone || '');
      const addr = initialData.address || '';
      setAddress(addr);
      const isKnownVillage = CAMBODIAN_VILLAGES.some(
        (v) => v.name === addr || v.fullName === addr
      );
      setIsCustomAddress(!isKnownVillage && addr.trim() !== '');
      setProvince(initialData.province || 'ខេត្តសៀមរាប');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setNote(initialData.note || '');
      setStatus(initialData.status || 'active');
      setCategory(initialData.category || 'general');
      setPriority(initialData.priority || 'medium');
      setTelegram(initialData.telegram || '');
      setEmail(initialData.email || '');
      setBalance(initialData.balance !== undefined ? String(initialData.balance) : '0');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setIsCustomAddress(false);
      setProvince('ខេត្តសៀមរាប');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setStatus('active');
      setCategory('general');
      setPriority('medium');
      setTelegram('');
      setEmail('');
      setBalance('0');
      setErrors({});
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t.customerForm.validation.nameRequired;
    }

    if (!phone.trim()) {
      newErrors.phone = t.customerForm.validation.phoneRequired;
    } else if (phone.trim().length < 8) {
      newErrors.phone = t.customerForm.validation.phoneInvalid;
    }

    if (!date) {
      newErrors.date = t.customerForm.validation.dateRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedBalance = parseFloat(balance) || 0;

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      province: province.trim(),
      date,
      note: note.trim(),
      status,
      category,
      priority,
      telegram: telegram.trim() || undefined,
      email: email.trim() || undefined,
      balance: parsedBalance,
      currency: 'USD',
      history: initialData?.history || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name and Phone Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.customerName} <span className="text-destructive font-bold">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder={t.customerForm.customerNamePlaceholder}
              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border rounded-xl outline-none transition-all font-khmer text-foreground ${
                errors.name
                  ? 'border-destructive focus:ring-1 focus:ring-destructive'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1 font-khmer font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.phoneNumber} <span className="text-destructive font-bold">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              placeholder={t.customerForm.phoneNumberPlaceholder}
              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border rounded-xl outline-none font-mono transition-all text-foreground ${
                errors.phone
                  ? 'border-destructive focus:ring-1 focus:ring-destructive'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1 font-khmer font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Address and Province Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Address */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.address}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <MapPin className="w-4 h-4" />
            </div>
            <select
              value={
                isCustomAddress
                  ? '__custom__'
                  : CAMBODIAN_VILLAGES.find((v) => v.name === address || v.fullName === address)?.name || (address ? '__custom__' : '')
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__custom__') {
                  setIsCustomAddress(true);
                  setAddress('');
                } else {
                  setIsCustomAddress(false);
                  setAddress(val);
                  if (!province || province === 'រាជធានីភ្នំពេញ') {
                    setProvince('ខេត្តសៀមរាប');
                  }
                }
              }}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-khmer text-foreground cursor-pointer"
            >
              <option value="">{isKhmer ? '-- ជ្រើសរើសភូមិ (អាសយដ្ឋាន) --' : '-- Select Village (Address) --'}</option>
              {CAMBODIAN_VILLAGES.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.num}. {v.name}
                </option>
              ))}
              <option value="__custom__">
                {isKhmer ? '✏️ ផ្សេងទៀត (បញ្ចូលអាសយដ្ឋានដោយផ្ទាល់)...' : '✏️ Other (Custom address)...'}
              </option>
            </select>
          </div>
          {isCustomAddress && (
            <div className="mt-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t.customerForm.addressPlaceholder}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-khmer text-foreground"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Province / City */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.province}
          </label>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-khmer text-foreground cursor-pointer"
          >
            <option value="">{t.customerForm.selectProvince}</option>
            {CAMBODIAN_PROVINCES.map((prov) => (
              <option key={prov.km} value={prov.km}>
                {isKhmer ? prov.km : prov.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date, Status, Category Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Date */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.date} <span className="text-destructive font-bold">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono text-foreground"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.status}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomerStatus)}
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-khmer text-foreground cursor-pointer"
          >
            <option value="active">{t.status.active}</option>
            <option value="pending">{t.status.pending}</option>
            <option value="debt">{t.status.debt}</option>
            <option value="completed">{t.status.completed}</option>
            <option value="inactive">{t.status.inactive}</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.category}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CustomerCategory)}
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-khmer text-foreground cursor-pointer"
          >
            <option value="general">{t.categories.general}</option>
            <option value="vip">{t.categories.vip}</option>
            <option value="wholesale">{t.categories.wholesale}</option>
            <option value="retail">{t.categories.retail}</option>
            <option value="service">{t.categories.service}</option>
            <option value="online">{t.categories.online}</option>
          </select>
        </div>
      </div>

      {/* Note / Description */}
      <div>
        <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
          {t.customerForm.note}
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.customerForm.notePlaceholder}
          className="w-full p-3.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-khmer leading-relaxed text-foreground"
        />
      </div>

      {/* Additional Optional Fields */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs font-bold text-muted-foreground font-khmer mb-3">
          {t.common.optional} (Telegram, Email, សមតុល្យ)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Telegram */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground font-khmer mb-1">
              {t.customerForm.telegram}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Send className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder={t.customerForm.telegramPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono text-foreground"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground font-khmer mb-1">
              {t.customerForm.email}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.customerForm.emailPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono text-foreground"
              />
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground font-khmer mb-1">
              {t.customerForm.balance}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <input
                type="number"
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder={t.customerForm.balancePlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t.common.cancel}
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {initialData ? t.customerForm.submitEdit : t.customerForm.submitAdd}
        </Button>
      </div>
    </form>
  );
};
