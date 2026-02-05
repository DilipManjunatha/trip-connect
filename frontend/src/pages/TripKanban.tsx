/**
 * Trip Kanban — board at /groups/:id/kanban (spec §6.5).
 * Columns: To Do, In Progress, Done. Cards with title, description; create/edit modal.
 * BOARD layout (full-width).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import { KanbanCard, TripGroup } from '../types';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { Button, Modal, Input, FormField, Select } from '../components/ui';

type OutletContext = { trip: TripGroup; groupId: string };

type AnchorRect = { top: number; left: number; right: number; bottom: number };

const COLUMNS: { id: KanbanCard['status']; label: string }[] = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'DONE', label: 'Done' },
];

/** Sticky-note yellow for To Do column; header styles per status */
function getColumnHeaderStyles(status: KanbanCard['status']): string {
  switch (status) {
    case 'TODO':
      return 'bg-yellow-100 border-amber-200/80 text-amber-900 border-l-4 border-l-amber-500';
    case 'IN_PROGRESS':
      return 'bg-primary-100 border-primary-200 text-primary-900 border-l-4 border-l-primary-600';
    case 'DONE':
      return 'bg-success-100 border-success-200 text-success-900 border-l-4 border-l-success-600';
    default:
      return 'bg-gray-200/90 border-gray-300 text-gray-800';
  }
}

function getColumnLaneBg(status: KanbanCard['status']): string {
  return status === 'TODO' ? 'bg-yellow-50/90' : 'bg-gray-50';
}

const TripKanban: React.FC = () => {
  const { trip, groupId } = useOutletContext<OutletContext>();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [menuCardId, setMenuCardId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<AnchorRect | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'TODO' as KanbanCard['status'] });
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const fetchCards = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const res = await api.get(`/groups/${groupId}/kanban`);
      const data = res.data?.data?.cards ?? res.data?.cards ?? res.data;
      setCards(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const e = err as { isNetworkError?: boolean; response?: { data?: { message?: string } } };
      if ((e as { isNetworkError?: boolean }).isNetworkError) setNetworkError(true);
      else toast.error(e.response?.data?.message ?? 'Failed to load board');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [groupId]);

  const openCreate = (columnStatus?: KanbanCard['status']) => {
    setEditingCard(null);
    setFormData({
      title: '',
      description: '',
      status: columnStatus ?? 'TODO',
    });
    setModalOpen(true);
    closeCardMenu();
  };

  const openEdit = (card: KanbanCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      description: card.description ?? '',
      status: card.status,
    });
    setModalOpen(true);
    closeCardMenu();
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCard(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      if (editingCard) {
        await api.put(`/groups/${groupId}/kanban/${editingCard.id}`, {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          status: formData.status,
        });
        toast.success('Card updated');
      } else {
        await api.post(`/groups/${groupId}/kanban`, {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          status: formData.status,
        });
        toast.success('Card created');
      }
      closeModal();
      fetchCards();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Failed to save card');
    }
  };

  const moveCard = async (card: KanbanCard, newStatus: KanbanCard['status']) => {
    if (card.status === newStatus) return;
    try {
      await api.put(`/groups/${groupId}/kanban/${card.id}`, { status: newStatus });
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status: newStatus } : c))
      );
      closeCardMenu();
    } catch {
      toast.error('Failed to move card');
    }
  };

  const handleDelete = async (card: KanbanCard) => {
    if (!confirm('Delete this card?')) return;
    try {
      await api.delete(`/groups/${groupId}/kanban/${card.id}`);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      closeCardMenu();
    } catch {
      toast.error('Failed to delete card');
    }
  };

  const openCardMenu = useCallback((cardId: string, buttonEl: HTMLButtonElement) => {
    setMenuAnchor(buttonEl.getBoundingClientRect());
    setMenuCardId(cardId);
  }, []);

  const closeCardMenu = useCallback(() => {
    setMenuCardId(null);
    setMenuAnchor(null);
  }, []);

  useEffect(() => {
    if (!menuCardId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCardMenu();
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuPanelRef.current?.contains(target) ||
        Object.values(menuButtonRefs.current).some((el) => el?.contains(target))
      )
        return;
      closeCardMenu();
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuCardId, closeCardMenu]);

  const cardsByStatus = (status: KanbanCard['status']) =>
    cards.filter((c) => c.status === status);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[280px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (networkError) {
    return (
      <DelightfulError
        onRetry={() => {
          setNetworkError(false);
          fetchCards();
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="text-sm text-gray-500">
          Tasks and reminders for <strong>{trip.name}</strong>
        </p>
        <Button onClick={() => openCreate()} aria-label="Add card" className="min-h-touch min-w-touch flex items-center justify-center">
          <PlusIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 overflow-auto">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className={`flex flex-col rounded-xl border border-gray-200 min-w-[260px] overflow-hidden ${getColumnLaneBg(col.id)}`}
          >
            <div
              className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${getColumnHeaderStyles(col.id)}`}
            >
              <h3 className="font-semibold tracking-tight">{col.label}</h3>
              <button
                type="button"
                onClick={() => openCreate(col.id)}
                className="flex items-center justify-center min-h-touch min-w-touch p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                aria-label={`Add card to ${col.label}`}
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            <div className={`flex-1 overflow-y-auto p-3 space-y-2.5 ${col.id === 'TODO' ? 'bg-yellow-50/60' : 'bg-gray-50/80'}`}>
              {cardsByStatus(col.id).map((card) => (
                <div
                  key={card.id}
                  className="group relative bg-white rounded-lg border border-gray-200 shadow p-3 hover:shadow-md hover:border-gray-300 transition"
                >
                  <div className="pr-8">
                    <p className="font-medium text-gray-900">{card.title}</p>
                    {card.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{card.description}</p>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      ref={(el) => { menuButtonRefs.current[card.id] = el; }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (menuCardId === card.id) closeCardMenu();
                        else openCardMenu(card.id, e.currentTarget);
                      }}
                      className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                      aria-label="Card options"
                      aria-expanded={menuCardId === card.id}
                      aria-haspopup="true"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {menuCardId && menuAnchor &&
        createPortal(
          (() => {
            const card = cards.find((c) => c.id === menuCardId);
            const colId = card?.status ?? 'TODO';
            if (!card) return null;
            const menuWidth = 208;
            const padding = 8;
            const spaceBelow = window.innerHeight - menuAnchor.bottom;
            const spaceAbove = menuAnchor.top;
            const openDown = spaceBelow >= 220 || spaceBelow >= spaceAbove;
            const top = openDown ? menuAnchor.bottom + padding : undefined;
            const bottom = openDown ? undefined : window.innerHeight - menuAnchor.top + padding;
            const left = menuAnchor.right - menuWidth >= 8 ? menuAnchor.right - menuWidth : Math.max(8, menuAnchor.left);
            return (
              <div
                ref={menuPanelRef}
                role="menu"
                aria-orientation="vertical"
                className="fixed z-[100] w-[208px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
                style={{
                  top: openDown ? `${top}px` : undefined,
                  bottom: !openDown ? `${bottom}px` : undefined,
                  left: `${Math.min(left, window.innerWidth - menuWidth - 8)}px`,
                }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { openEdit(card); closeCardMenu(); }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <PencilSquareIcon className="h-4 w-4 shrink-0 text-gray-500" /> Edit
                </button>
                {colId !== 'TODO' && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => moveCard(card, 'TODO')}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    <ArrowLeftIcon className="h-4 w-4 shrink-0 text-gray-500" /> Move to To Do
                  </button>
                )}
                {colId !== 'IN_PROGRESS' && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => moveCard(card, 'IN_PROGRESS')}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-500" /> Move to In Progress
                  </button>
                )}
                {colId !== 'DONE' && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => moveCard(card, 'DONE')}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    <CheckIcon className="h-4 w-4 shrink-0 text-gray-500" /> Move to Done
                  </button>
                )}
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleDelete(card)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                >
                  <TrashIcon className="h-4 w-4 shrink-0" /> Delete
                </button>
              </div>
            );
          })(),
          document.body
        )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCard ? 'Edit card' : 'New card'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task or reminder"
              required
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={formData.status}
              onChange={(v) => setFormData({ ...formData, status: v as KanbanCard['status'] })}
              options={COLUMNS.map((c) => ({ value: c.id, label: c.label }))}
            />
          </FormField>
          <div className="flex gap-3 pt-2">
            <Button type="submit">{editingCard ? 'Save' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TripKanban;
