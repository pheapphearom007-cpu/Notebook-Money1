import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Send,
  Mail,
  DollarSign,
  Package,
  Layers,
  AlertCircle,
  FileText,
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

  // Primary required field
  const [customerName, setCustomerName] = useState('');

  // Primary optional debt fields
  const [productCategory, setProductCategory] = useState<CustomerCategory>('general');
  const [amount, setAmount] = useState<string>('1');
  const [priceOfGoods, setPriceOfGoods] = useState<string>('0');
  const [outstandingDebt, setOutstandingDebt] = useState<string>('0');
  const [notes, setNotes] = useState('');

  // Contact and metadata fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const [province, setProvince] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<CustomerStatus>('active');
  const [priority, setPriority] = useState<CustomerPriority>('medium');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName || initialData.name || '');
      setProductCategory((initialData.productCategory || initialData.category || 'general') as CustomerCategory);
      setAmount(initialData.amount !== undefined ? String(initialData.amount) : '1');
      setPriceOfGoods(initialData.priceOfGoods !== undefined ? String(initialData.priceOfGoods) : '0');
      const debt = initialData.outstandingDebt !== undefined ? initialData.outstandingDebt : (initialData.balance !== undefined ? initialData.balance : 0);
      setOutstandingDebt(String(debt));
      setNotes(initialData.notes || initialData.note || '');

      setPhone(initialData.phone || '');
      const addr = initialData.address || '';
      setAddress(addr);
      const isKnownVillage = CAMBODIAN_VILLAGES.some(
        (v) => v.name === addr || v.fullName === addr
      );
      setIsCustomAddress(!isKnownVillage && addr.trim() !== '');
      setProvince(initialData.province || 'ខេត្តសៀមរាប');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setStatus(initialData.status || 'active');
      setPriority(initialData.priority || 'medium');
      setTelegram(initialData.telegram || '');
      setEmail(initialData.email || '');
      setErrors({});
    } else {
      setCustomerName('');
      setProductCategory('general');
      setAmount('1');
      setPriceOfGoods('0');
      setOutstandingDebt('0');
      setNotes('');
      setPhone('');
      setAddress('');
      setIsCustomAddress(false);
      setProvince('ខេត្តសៀមរាប');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('active');
      setPriority('medium');
      setTelegram('');
      setEmail('');
      setErrors({});
    }
  }, [initialData]);

  // Validation according to Section 8
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Required: customer_name
    if (!customerName.trim()) {
      newErrors.customerName = t.customerForm.validation.nameRequired;
    }

    // 2. Numeric validation: amount (must not be NaN, negative)
    if (amount.trim() !== '') {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        newErrors.amount = t.customerForm.validation.amountInvalid;
      }
    }

    // 3. Numeric validation: price_of_goods (must not be NaN, negative)
    if (priceOfGoods.trim() !== '') {
      const parsedPrice = Number(priceOfGoods);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        newErrors.priceOfGoods = t.customerForm.validation.priceInvalid;
      }
    }

    // 4. Numeric validation: outstanding_debt (must not be NaN, negative)
    if (outstandingDebt.trim() !== '') {
      const parsedDebt = Number(outstandingDebt);
      if (isNaN(parsedDebt) || parsedDebt < 0) {
        newErrors.outstandingDebt = t.customerForm.validation.debtInvalid;
      }
    }

    // 5. Phone validation (optional, but if provided check format)
    if (phone.trim() && phone.trim().length < 8) {
      newErrors.phone = t.customerForm.validation.phoneInvalid;
    }

    // 6. Date validation
    if (!date) {
      newErrors.date = t.customerForm.validation.dateRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedAmount = amount.trim() ? Math.max(0, parseFloat(amount) || 0) : 0;
    const parsedPrice = priceOfGoods.trim() ? Math.max(0, parseFloat(priceOfGoods) || 0) : 0;
    const parsedDebt = outstandingDebt.trim() ? Math.max(0, parseFloat(outstandingDebt) || 0) : 0;

    // Automatically set status to debt if customer has positive outstanding debt and status is default active
    let calculatedStatus = status;
    if (parsedDebt > 0 && status === 'active') {
      calculatedStatus = 'debt';
    }

    onSubmit({
      customerName: customerName.trim(),
      name: customerName.trim(),
      productCategory,
      category: productCategory,
      amount: parsedAmount,
      priceOfGoods: parsedPrice,
      outstandingDebt: parsedDebt,
      balance: parsedDebt,
      notes: notes.trim(),
      note: notes.trim(),
      phone: phone.trim(),
      address: address.trim(),
      province: province.trim(),
      date,
      status: calculatedStatus,
      priority,
      telegram: telegram.trim() || undefined,
      email: email.trim() || undefined,
      currency: 'USD',
      history: initialData?.history || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Customer Name (Required) & Product Category (Optional) */}
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
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
              }}
              placeholder={t.customerForm.customerNamePlaceholder}
              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border rounded-xl outline-none transition-all font-khmer text-foreground ${
                errors.customerName
                  ? 'border-destructive focus:ring-1 focus:ring-destructive'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>
          {errors.customerName && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1 font-khmer font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.customerName}
            </p>
          )}
        </div>

        {/* Product Category */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.productCategory} <span className="text-muted-foreground text-[10px] font-normal">({t.common.optional})</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Layers className="w-4 h-4" />
            </div>
            <select
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value as CustomerCategory)}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-khmer text-foreground cursor-pointer"
            >
              <option value="general">{t.categories.general}</option>
              <option value="retail">{t.categories.retail}</option>
              <option value="wholesale">{t.categories.wholesale}</option>
              <option value="vip">{t.categories.vip}</option>
              <option value="service">{t.categories.service}</option>
              <option value="online">{t.categories.online}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Amount, Price of Goods, and Outstanding Debt Row */}
      <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground font-khmer flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-primary" />
            ទំនិញ និងទំហំទឹកប្រាក់ជំពាក់ (Debt Ledger)
          </span>
          <span className="text-[11px] text-muted-foreground font-khmer">
            {t.common.optional}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Amount / Quantity */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground font-khmer mb-1">
              {t.customerForm.amount}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Package className="w-3.5 h-3.5" />
              </div>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                placeholder={t.customerForm.amountPlaceholder}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-background border rounded-xl outline-none font-mono text-foreground ${
                  errors.amount
                    ? 'border-destructive focus:ring-1 focus:ring-destructive'
                    : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-[11px] text-destructive font-khmer">{errors.amount}</p>
            )}
          </div>

          {/* Price of Goods */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground font-khmer mb-1">
              {t.customerForm.priceOfGoods}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={priceOfGoods}
                onChange={(e) => {
                  setPriceOfGoods(e.target.value);
                  if (errors.priceOfGoods) setErrors((prev) => ({ ...prev, priceOfGoods: '' }));
                }}
                placeholder={t.customerForm.priceOfGoodsPlaceholder}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-background border rounded-xl outline-none font-mono text-foreground ${
                  errors.priceOfGoods
                    ? 'border-destructive focus:ring-1 focus:ring-destructive'
                    : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </div>
            {errors.priceOfGoods && (
              <p className="mt-1 text-[11px] text-destructive font-khmer">{errors.priceOfGoods}</p>
            )}
          </div>

          {/* Outstanding Debt */}
          <div>
            <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-400 font-khmer mb-1">
              {t.customerForm.outstandingDebt}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700 dark:text-amber-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={outstandingDebt}
                onChange={(e) => {
                  setOutstandingDebt(e.target.value);
                  if (errors.outstandingDebt) setErrors((prev) => ({ ...prev, outstandingDebt: '' }));
                }}
                placeholder={t.customerForm.outstandingDebtPlaceholder}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-background border rounded-xl outline-none font-mono font-bold text-foreground ${
                  errors.outstandingDebt
                    ? 'border-destructive focus:ring-1 focus:ring-destructive'
                    : 'border-amber-500/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                }`}
              />
            </div>
            {errors.outstandingDebt && (
              <p className="mt-1 text-[11px] text-destructive font-khmer">{errors.outstandingDebt}</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Phone & Date Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Phone Number (Optional) */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.phoneNumber} <span className="text-muted-foreground text-[10px] font-normal">({t.common.optional})</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              inputMode="tel"
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
      </div>

      {/* 4. Address and Province Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
            {t.customerForm.address} <span className="text-muted-foreground text-[10px] font-normal">({t.common.optional})</span>
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

      {/* 5. Notes / Remarks */}
      <div>
        <label className="block text-xs font-bold text-foreground font-khmer mb-1.5">
          {t.customerForm.notes} <span className="text-muted-foreground text-[10px] font-normal">({t.common.optional})</span>
        </label>
        <div className="relative">
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.customerForm.notePlaceholder}
            className="w-full p-3.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-khmer leading-relaxed text-foreground"
          />
        </div>
      </div>

      {/* 6. Optional Telegram, Email, Priority */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs font-bold text-muted-foreground font-khmer mb-3">
          {t.common.optional} (Telegram, Email, Priority)
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

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground font-khmer mb-1">
              {t.customerForm.priority}
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as CustomerPriority)}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-khmer text-foreground cursor-pointer"
            >
              <option value="low">ធម្មតា (Low)</option>
              <option value="medium">មធ្យម (Medium)</option>
              <option value="high">បន្ទាន់/អាទិភាពខ្ពស់ (High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-4 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 sm:gap-3 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto py-2.5 active:scale-95"
        >
          {t.common.cancel}
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full sm:w-auto py-2.5 font-bold active:scale-95"
        >
          {initialData ? t.customerForm.submitEdit : t.customerForm.submitAdd}
        </Button>
      </div>
    </form>
  );
};
