import React, { useState } from 'react';
import {
  StickyNote,
  Plus,
  Pin,
  Search,
  Edit2,
  Trash2,
  User,
  Calendar,
  X,
} from 'lucide-react';
import { GeneralNote, NoteColor } from '../../types/note';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { NoteFormModal } from './NoteFormModal';
import { useLanguage } from '../../context/LanguageContext';
import { useCustomers } from '../../context/CustomerContext';
import { useToast } from '../../context/ToastContext';

interface NotesViewProps {
  onViewCustomerById?: (customerId: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ onViewCustomerById }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
  } = useCustomers();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<GeneralNote | null>(null);

  const [noteToDelete, setNoteToDelete] = useState<GeneralNote | null>(null);

  // ROM LATEX visual theme note color variations
  const colorStyles: Record<NoteColor, { card: string; border: string; tag: string }> = {
    yellow: {
      card: 'bg-card',
      border: 'border-amber-300/70 dark:border-amber-700/50',
      tag: 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-300/50',
    },
    blue: {
      card: 'bg-card',
      border: 'border-primary/40',
      tag: 'bg-primary/10 text-primary border border-primary/20',
    },
    green: {
      card: 'bg-card',
      border: 'border-emerald-500/40 dark:border-emerald-700/50',
      tag: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30',
    },
    purple: {
      card: 'bg-card',
      border: 'border-indigo-400/40 dark:border-indigo-700/50',
      tag: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-400/30',
    },
    rose: {
      card: 'bg-card',
      border: 'border-rose-400/40 dark:border-rose-700/50',
      tag: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-400/30',
    },
    default: {
      card: 'bg-card',
      border: 'border-border',
      tag: 'bg-secondary text-secondary-foreground border border-border',
    },
  };

  const filteredNotes = notes.filter((n) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchCategory = n.category?.toLowerCase().includes(q);
      const matchCustomer = n.customerName?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchCategory && !matchCustomer) return false;
    }

    if (selectedTag !== 'all' && n.category !== selectedTag) {
      return false;
    }

    return true;
  });

  const allCategories = Array.from(
    new Set(notes.map((n) => n.category).filter(Boolean))
  ) as string[];

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  const handleOpenAdd = () => {
    setNoteToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: GeneralNote) => {
    setNoteToEdit(note);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: Omit<GeneralNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (noteToEdit) {
      updateNote(noteToEdit.id, data);
      showToast(t.toasts.noteUpdated, 'success');
    } else {
      addNote(data);
      showToast(t.toasts.noteAdded, 'success');
    }
  };

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
      showToast(t.toasts.noteDeleted, 'info');
      setNoteToDelete(null);
    }
  };

  const renderNoteCard = (note: GeneralNote) => {
    const styling = colorStyles[note.color] || colorStyles.default;

    return (
      <div
        key={note.id}
        className={`rounded-2xl border ${styling.border} ${styling.card} p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 relative group`}
      >
        <div>
          {/* Top Row: Category tag and pin button */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {note.category && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-khmer ${styling.tag}`}
                >
                  {note.category}
                </span>
              )}
              {note.customerName && (
                <button
                  onClick={() =>
                    note.customerId && onViewCustomerById && onViewCustomerById(note.customerId)
                  }
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border hover:bg-muted flex items-center gap-1 font-khmer cursor-pointer"
                >
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span>{note.customerName}</span>
                </button>
              )}
            </div>

            {/* Pin Toggle */}
            <button
              onClick={() => togglePinNote(note.id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                note.isPinned
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={note.isPinned ? t.common.unpinned : t.common.pinned}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Title */}
          <h4 className="text-base font-bold text-foreground font-khmer mb-2 leading-snug">
            {note.title}
          </h4>

          {/* Content */}
          <p className="text-xs sm:text-sm text-muted-foreground font-khmer leading-relaxed whitespace-pre-line">
            {note.content}
          </p>
        </div>

        {/* Footer: Date and Action Buttons */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(note.updatedAt).toLocaleDateString('km-KH')}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenEdit(note)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title={t.common.edit}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setNoteToDelete(note)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title={t.common.delete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title & Add Note Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-khmer">
            {t.notesSection.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-khmer mt-0.5">
            {t.notesSection.subtitle}
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t.notesSection.addNote}
        </Button>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកកំណត់ចំណាំតាមចំណងជើង ឬខ្លឹមសារ..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground outline-none font-khmer"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        {allCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-khmer whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted'
              }`}
            >
              {t.common.all}
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedTag(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-khmer whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTag === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<StickyNote className="w-8 h-8 text-muted-foreground" />}
          title={t.notesSection.emptyTitle}
          description={t.notesSection.emptyDescription}
          actionText={t.notesSection.addNote}
          onAction={handleOpenAdd}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 font-khmer">
                <Pin className="w-3.5 h-3.5 text-primary fill-current" />
                <span>{t.common.pinned} ({pinnedNotes.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map((note) => renderNoteCard(note))}
              </div>
            </div>
          )}

          {/* Other Notes Section */}
          {otherNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-khmer">
                  កំណត់ចំណាំផ្សេងទៀត ({otherNotes.length})
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherNotes.map((note) => renderNoteCard(note))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note Form Modal */}
      <NoteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        noteToEdit={noteToEdit}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t.dialogs.deleteNoteTitle}
        message={t.dialogs.deleteNoteConfirm}
        isDanger={true}
      />
    </div>
  );
};
