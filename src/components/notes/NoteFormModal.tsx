import React, { useState, useEffect } from 'react';
import { Pin, Tag, User } from 'lucide-react';
import { GeneralNote, NoteColor } from '../../types/note';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomers } from '../../context/CustomerContext';

interface NoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: GeneralNote | null;
  onSubmit: (data: Omit<GeneralNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const NoteFormModal: React.FC<NoteFormModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const { customers } = useCustomers();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [color, setColor] = useState<NoteColor>('default');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setCategory(noteToEdit.category || '');
      setCustomerId(noteToEdit.customerId || '');
      setColor(noteToEdit.color || 'default');
      setIsPinned(noteToEdit.isPinned || false);
    } else {
      setTitle('');
      setContent('');
      setCategory('');
      setCustomerId('');
      setColor('default');
      setIsPinned(false);
    }
    setError('');
  }, [noteToEdit, isOpen]);

  const colorOptions: { id: NoteColor; bg: string; border: string }[] = [
    { id: 'default', bg: 'bg-card', border: 'border-border' },
    { id: 'blue', bg: 'bg-primary/20', border: 'border-primary' },
    { id: 'yellow', bg: 'bg-amber-500/20', border: 'border-amber-500' },
    { id: 'green', bg: 'bg-emerald-500/20', border: 'border-emerald-500' },
    { id: 'purple', bg: 'bg-indigo-500/20', border: 'border-indigo-500' },
    { id: 'rose', bg: 'bg-rose-500/20', border: 'border-rose-500' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setError('សូមបញ្ចូលចំណងជើង ឬខ្លឹមសារកំណត់ចំណាំ');
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === customerId);

    onSubmit({
      title: title.trim() || 'កំណត់ចំណាំគ្មានចំណងជើង',
      content: content.trim(),
      category: category.trim() || undefined,
      customerId: customerId || undefined,
      customerName: selectedCustomer ? selectedCustomer.name : undefined,
      color,
      isPinned,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={noteToEdit ? t.notesSection.editNote : t.notesSection.addNote}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1">
            {t.notesSection.noteTitle}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
            placeholder={t.notesSection.noteTitlePlaceholder}
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-khmer text-foreground"
            autoFocus
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-bold text-foreground font-khmer mb-1">
            {t.notesSection.noteContent}
          </label>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError('');
            }}
            placeholder={t.notesSection.noteContentPlaceholder}
            className="w-full p-3.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-khmer leading-relaxed text-foreground"
          />
          {error && <p className="text-xs text-destructive mt-1 font-khmer font-semibold">{error}</p>}
        </div>

        {/* Category & Customer Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-foreground font-khmer mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t.notesSection.category}</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t.notesSection.categoryPlaceholder}
              className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-khmer text-foreground"
            />
          </div>

          {/* Link to Customer */}
          <div>
            <label className="block text-xs font-bold text-foreground font-khmer mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t.notesSection.linkCustomer}</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-khmer text-foreground cursor-pointer"
            >
              <option value="">{t.notesSection.selectCustomer}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Color and Pin Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border">
          {/* Color Palettes */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground font-khmer mr-1">
              {t.notesSection.color}:
            </span>
            {colorOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setColor(opt.id)}
                className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${opt.bg} ${opt.border} ${
                  color === opt.id
                    ? 'ring-2 ring-primary scale-110 shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title={opt.id}
              />
            ))}
          </div>

          {/* Pin Toggle */}
          <label className="flex items-center gap-2 text-xs font-bold text-foreground font-khmer cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-primary rounded-md focus:ring-primary/20"
            />
            <span className="flex items-center gap-1">
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-primary fill-current' : 'text-muted-foreground'}`} />
              {t.notesSection.pinNote}
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" size="sm">
            {t.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
