/**
 * Single ticket smart card view — FOCUS layout (spec §6.6, §7.1).
 * Full-screen scannable card; back to tickets list.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { Button } from '../components/ui';
import SmartCard from '../components/SmartCard';
import { groupTickets } from '../ux/routes';
import type { Ticket } from '../types';

const TicketCardView: React.FC = () => {
  const { id: groupId, ticketId } = useParams<{ id: string; ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [processingOcr, setProcessingOcr] = useState(false);

  useEffect(() => {
    if (!groupId || !ticketId) return;
    fetchTicket();
  }, [groupId, ticketId]);

  const fetchTicket = async () => {
    if (!groupId || !ticketId) return;
    try {
      setLoading(true);
      setNetworkError(false);
      const res = await api.get(`/groups/${groupId}/tickets/${ticketId}`);
      setTicket(res.data?.data?.ticket ?? res.data?.ticket ?? null);
    } catch (err: unknown) {
      if ((err as { isNetworkError?: boolean }).isNetworkError) setNetworkError(true);
      else toast.error('Failed to load ticket');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOcr = async () => {
    if (!groupId || !ticket) return;
    setProcessingOcr(true);
    try {
      const res = await api.post(`/groups/${groupId}/tickets/${ticket.id}/process-ocr`);
      const updated = res.data?.data?.ticket as Ticket | undefined;
      if (updated) setTicket(updated);
      toast.success('OCR completed');
    } catch {
      toast.error('OCR failed');
    } finally {
      setProcessingOcr(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent" />
        <p className="text-gray-500 text-sm">Loading card…</p>
      </div>
    );
  }

  if (networkError) {
    return (
      <DelightfulError
        onRetry={() => {
          setNetworkError(false);
          fetchTicket();
        }}
      />
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">Ticket not found.</p>
        <Button variant="outline" onClick={() => groupId && navigate(groupTickets(groupId))}>
          Back to tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          onClick={() => groupId && navigate(groupTickets(groupId))}
        >
          Back to tickets
        </Button>
      </div>

      <div className="flex justify-center py-4">
        <SmartCard
          ticket={ticket}
          onShare={() => toast('Share not implemented')}
          className="w-full max-w-md shadow-lg"
        />
      </div>

      {ticket.ocrStatus !== 'COMPLETED' && ticket.ocrStatus !== 'PENDING' && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<SparklesIcon className="h-4 w-4" />}
            onClick={handleProcessOcr}
            disabled={processingOcr}
          >
            {processingOcr ? 'Processing…' : 'Run OCR'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketCardView;
