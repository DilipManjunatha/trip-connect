/**
 * Trip Tickets — list by category, file attachment, link to smart card (spec §6.6).
 * Optional OCR pipeline: process-ocr endpoint to populate smart card data.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useTripFromRoute } from '../context/TripContext';
import {
  TicketIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { Button, Input, Modal, FormField, Select } from '../components/ui';
import { groupTicketCard } from '../ux/routes';
import type { Ticket, TicketType } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function getUploadUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  // Backend may store "uploads/tickets/x" (legacy) or "tickets/x"; avoid double /uploads/
  const pathUnderUploads = filePath.replace(/^uploads\/?/, '');
  return `${API_BASE}/uploads/${pathUnderUploads}`;
}

const TICKET_TYPES: { value: TicketType; label: string }[] = [
  { value: 'TICKET', label: 'Ticket' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'BILL', label: 'Bill' },
  { value: 'BOOKING', label: 'Booking' },
  { value: 'DOCUMENT', label: 'Document' },
];

/** Pre-filled categories common in the travel industry (add/edit ticket). */
const TICKET_CATEGORIES: { value: string; label: string }[] = [
  { value: 'Flight', label: 'Flight' },
  { value: 'Train', label: 'Train' },
  { value: 'Bus', label: 'Bus / Coach' },
  { value: 'Ferry', label: 'Ferry / Cruise' },
  { value: 'Hotel', label: 'Hotel' },
  { value: 'Car Rental', label: 'Car Rental' },
  { value: 'Activity', label: 'Activity / Tour' },
  { value: 'Visa', label: 'Visa / Entry' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Event', label: 'Event' },
  { value: 'Other', label: 'Other' },
];

/** Order for grouping tickets in the list (extends TICKET_CATEGORIES order). */
const CATEGORY_ORDER = [
  'Flight', 'Train', 'Bus', 'Ferry', 'Hotel', 'Car Rental', 'Activity', 'Visa', 'Insurance', 'Event', 'Other',
];

const TripTickets: React.FC = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trip } = useTripFromRoute();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState({ title: '', category: '', type: 'TICKET' as TicketType });
  const [file, setFile] = useState<File | null>(null);
  const [processingOcr, setProcessingOcr] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    fetchTickets();
  }, [groupId]);

  const fetchTickets = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setNetworkError(false);
      const res = await api.get(`/groups/${groupId}/tickets`);
      const data = res.data?.data?.tickets ?? res.data?.tickets ?? res.data;
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if ((err as { isNetworkError?: boolean }).isNetworkError) setNetworkError(true);
      else toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const ticketsByCategory = useMemo(() => {
    const map = new Map<string, Ticket[]>();
    for (const t of tickets) {
      const cat = t.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    const ordered: { category: string; tickets: Ticket[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) ordered.push({ category: cat, tickets: map.get(cat)! });
    }
    map.forEach((arr, cat) => {
      if (!CATEGORY_ORDER.includes(cat)) ordered.push({ category: cat, tickets: arr });
    });
    return ordered;
  }, [tickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    try {
      if (editingTicket) {
        await api.put(`/groups/${groupId}/tickets/${editingTicket.id}`, {
          title: formData.title,
          category: formData.category || undefined,
          type: formData.type,
        });
        toast.success('Ticket updated');
      } else {
        const payload = new FormData();
        payload.append('title', formData.title);
        if (formData.category) payload.append('category', formData.category);
        payload.append('type', formData.type);
        if (file) payload.append('file', file);
        await api.post(`/groups/${groupId}/tickets`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Ticket added');
      }
      setShowAddModal(false);
      setEditingTicket(null);
      setFormData({ title: '', category: '', type: 'TICKET' });
      setFile(null);
      fetchTickets();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg || 'Failed to save ticket');
    }
  };

  const handleDelete = async (id: string) => {
    if (!groupId || !confirm('Delete this ticket?')) return;
    try {
      await api.delete(`/groups/${groupId}/tickets/${id}`);
      toast.success('Ticket deleted');
      fetchTickets();
    } catch {
      toast.error('Failed to delete ticket');
    }
  };

  const handleProcessOcr = async (ticket: Ticket) => {
    if (!groupId) return;
    setProcessingOcr(ticket.id);
    try {
      await api.post(`/groups/${groupId}/tickets/${ticket.id}/process-ocr`);
      toast.success('OCR completed');
      fetchTickets();
    } catch {
      toast.error('OCR failed');
    } finally {
      setProcessingOcr(null);
    }
  };

  const openCardView = (ticket: Ticket) => {
    if (groupId) navigate(groupTicketCard(groupId, ticket.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }
  if (networkError) {
    return (
      <DelightfulError
        onRetry={() => {
          setNetworkError(false);
          fetchTickets();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tickets</h1>
        <Button leftIcon={<PlusIcon className="h-5 w-5" />} onClick={() => { setEditingTicket(null); setFormData({ title: '', category: '', type: 'TICKET' }); setFile(null); setShowAddModal(true); }}>
          Add ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 text-lg mt-4">No tickets yet</p>
          <Button variant="ghost" className="mt-4" onClick={() => setShowAddModal(true)}>
            Add your first ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {ticketsByCategory.map(({ category, tickets: catTickets }) => (
            <section key={category} className="bg-white rounded-lg shadow overflow-hidden">
              <h2 className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                {category}
              </h2>
              <ul className="divide-y divide-gray-200">
                {catTickets.map((ticket) => (
                  <li key={ticket.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{ticket.title}</p>
                        <p className="text-sm text-gray-500">
                          {ticket.fileName ? (
                            <a
                              href={getUploadUrl(ticket.filePath) ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline inline-flex items-center gap-1"
                            >
                              {ticket.fileName}
                              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </a>
                          ) : (
                            'No file'
                          )}
                        </p>
                        {ticket.ocrStatus === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => openCardView(ticket)}
                            className="text-sm text-primary-600 hover:underline mt-1"
                          >
                            View smart card →
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ticket.ocrStatus !== 'COMPLETED' && ticket.ocrStatus !== 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<SparklesIcon className="h-4 w-4" />}
                            onClick={() => handleProcessOcr(ticket)}
                            disabled={!!processingOcr}
                          >
                            {processingOcr === ticket.id ? 'Processing…' : 'Run OCR'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCardView(ticket)}
                          title="Open card (full screen)"
                        >
                          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingTicket(ticket); setFormData({ title: ticket.title, category: ticket.category || '', type: ticket.type }); setShowAddModal(true); }}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDelete(ticket.id)}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setFile(null); }}
        title={editingTicket ? 'Edit ticket' : 'Add ticket'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Flight to Paris"
              required
            />
          </FormField>
          <FormField label="Category">
            <Select
              value={formData.category}
              onChange={(v) => setFormData({ ...formData, category: v })}
              options={
                formData.category && !TICKET_CATEGORIES.some((c) => c.value === formData.category)
                  ? [...TICKET_CATEGORIES, { value: formData.category, label: formData.category }]
                  : TICKET_CATEGORIES
              }
              placeholder="Select category"
            />
          </FormField>
          <FormField label="Type">
            <Select
              value={formData.type}
              onChange={(v) => setFormData({ ...formData, type: v as TicketType })}
              options={TICKET_TYPES}
            />
          </FormField>
          {!editingTicket && (
            <FormField label="File (PDF or image)">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary-50 file:text-primary-700"
              />
            </FormField>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingTicket ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TripTickets;
