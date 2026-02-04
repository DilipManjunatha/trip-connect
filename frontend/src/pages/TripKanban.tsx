/**
 * Trip Kanban — board at /groups/:id/kanban (spec §6.5).
 * Columns: To Do, In Progress, Done. Cards with title, description; create/edit modal.
 * BOARD layout (full-width).
 */

import React, { useState, useEffect } from 'react';
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

const COLUMNS: { id: KanbanCard['status']; label: string }[] = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'DONE', label: 'Done' },
];

const TripKanban: React.FC = () => {
  const { trip, groupId } = useOutletContext<OutletContext>();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [menuCardId, setMenuCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'TODO' as KanbanCard['status'] });

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
    setMenuCardId(null);
  };

  const openEdit = (card: KanbanCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      description: card.description ?? '',
      status: card.status,
    });
    setModalOpen(true);
    setMenuCardId(null);
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
      setMenuCardId(null);
    } catch {
      toast.error('Failed to move card');
    }
  };

  const handleDelete = async (card: KanbanCard) => {
    if (!confirm('Delete this card?')) return;
    try {
      await api.delete(`/groups/${groupId}/kanban/${card.id}`);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      setMenuCardId(null);
    } catch {
      toast.error('Failed to delete card');
    }
  };

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
        <Button onClick={() => openCreate()} aria-label="Add card">
          <PlusIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 overflow-auto">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="flex flex-col bg-gray-100/80 rounded-xl border border-gray-200 min-w-[260px] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/80 shrink-0">
              <h3 className="font-semibold text-gray-800">{col.label}</h3>
              <button
                type="button"
                onClick={() => openCreate(col.id)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label={`Add card to ${col.label}`}
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cardsByStatus(col.id).map((card) => (
                <div
                  key={card.id}
                  className="group relative bg-white rounded-lg border border-gray-200 shadow-sm p-3 hover:shadow transition"
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
                      onClick={() => setMenuCardId(menuCardId === card.id ? null : card.id)}
                      className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Card menu"
                    >
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>
                    {menuCardId === card.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          type="button"
                          onClick={() => openEdit(card)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <PencilSquareIcon className="h-4 w-4" /> Edit
                        </button>
                        {col.id !== 'TODO' && (
                          <button
                            type="button"
                            onClick={() => moveCard(card, 'TODO')}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <ArrowLeftIcon className="h-4 w-4" /> Move to To Do
                          </button>
                        )}
                        {col.id !== 'IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={() => moveCard(card, 'IN_PROGRESS')}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <ArrowRightIcon className="h-4 w-4" /> Move to In Progress
                          </button>
                        )}
                        {col.id !== 'DONE' && (
                          <button
                            type="button"
                            onClick={() => moveCard(card, 'DONE')}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <CheckIcon className="h-4 w-4" /> Move to Done
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(card)}
                          className="w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <TrashIcon className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

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
