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
import EmptyState from '../components/EmptyState';
import { Button, CreateFAB, Input, Modal, FormField, Select } from '../components/ui';
import { groupTicketCard } from '../ux/routes';
import { getUploadUrl, openAttachment } from '../utils/uploadUrl';
import type { Ticket, TicketType } from '../types';

function OcrStatusBadge({ status }: { status: Ticket['ocrStatus'] }) {
  const config: Record<Ticket['ocrStatus'], { label: string; className: string }> = {
    NONE: { label: 'Not scanned', className: 'bg-gray-100 text-gray-600' },
    PENDING: { label: 'Processing…', className: 'bg-primary-50 text-primary-700' },
    COMPLETED: { label: 'Scanned', className: 'bg-success-100 text-success-700' },
    FAILED: { label: 'Scan failed', className: 'bg-error-50 text-error-700' },
  };
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
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
      <div className="space-y-8 animate-pulse">
        <div className="h-9 w-48 bg-gray-200 rounded-lg" />
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="h-12 bg-gray-100 rounded-none" />
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <li key={i} className="p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
              </li>
            ))}
          </ul>
        </div>
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Tickets</h1>
        <span className="hidden md:inline-block">
          <Button leftIcon={<PlusIcon className="h-5 w-5" />} onClick={() => { setEditingTicket(null); setFormData({ title: '', category: '', type: 'TICKET' }); setFile(null); setShowAddModal(true); }}>
            Add ticket
          </Button>
        </span>
      </div>
      <CreateFAB
        label="Add ticket"
        onClick={() => { setEditingTicket(null); setFormData({ title: '', category: '', type: 'TICKET' }); setFile(null); setShowAddModal(true); }}
      />

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <EmptyState
            icon={<TicketIcon className="h-14 w-14" />}
            title="No tickets yet"
            description="Add flight, train, or hotel confirmations. Attach a file and run OCR to show carrier, time, seat, gate, and PNR on a smart card."
            actionButton={{ label: 'Add your first ticket', onClick: () => setShowAddModal(true) }}
            examples={['Flight or train e-tickets', 'Hotel confirmations', 'Activity vouchers']}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {ticketsByCategory.map(({ category, tickets: catTickets }) => (
            <section key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <h2 className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-base font-semibold text-gray-800">
                {category}
              </h2>
              <ul className="divide-y divide-gray-200">
                {catTickets.map((ticket) => (
                  <li key={ticket.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">{ticket.title}</p>
                          <OcrStatusBadge status={ticket.ocrStatus} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {ticket.fileName ? (
                            <button
                              type="button"
                              onClick={async () => {
                                const url = getUploadUrl(ticket.filePath);
                                if (!url) return;
                                try {
                                  await openAttachment(url, ticket.fileName);
                                } catch {
                                  toast.error('Failed to open file');
                                }
                              }}
                              className="text-primary-600 hover:underline inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded"
                            >
                              {ticket.fileName}
                              <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0" />
                            </button>
                          ) : (
                            'No file'
                          )}
                        </p>
                        {ticket.ocrStatus === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => openCardView(ticket)}
                            className="text-sm text-primary-600 hover:underline mt-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded"
                          >
                            View smart card →
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(ticket.filePath || ticket.fileName) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<SparklesIcon className="h-4 w-4" />}
                            onClick={() => handleProcessOcr(ticket)}
                            disabled={!!processingOcr}
                            title={ticket.ocrStatus === 'COMPLETED' ? 'Re-run OCR if data is wrong' : 'Extract text from ticket file'}
                          >
                            {processingOcr === ticket.id
                              ? 'Processing…'
                              : ticket.ocrStatus === 'COMPLETED'
                                ? 'Re-run OCR'
                                : 'Run OCR'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCardView(ticket)}
                          title="Open card (full screen)"
                          className="min-h-touch min-w-touch flex items-center justify-center"
                        >
                          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingTicket(ticket); setFormData({ title: ticket.title, category: ticket.category || '', type: ticket.type }); setShowAddModal(true); }}
                          className="min-h-touch min-w-touch flex items-center justify-center"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 min-h-touch min-w-touch flex items-center justify-center"
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
