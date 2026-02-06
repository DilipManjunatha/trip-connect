/**
 * Note detail — full note, edit, reminder date/time, follow-up (spec §6.8).
 * Serves both create (/notes/new) and edit (/notes/:id).
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Note } from '../types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { Button, Input, FormField, Select } from '../components/ui';
import { ROUTES } from '../ux';

const FOLLOW_UP_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'PENDING', label: 'Needs follow-up' },
  { value: 'DONE', label: 'Done' },
];

const NoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    reminderAt: '',
    followUp: 'NONE' as Note['followUp'],
  });
  const [navigateToNotes, setNavigateToNotes] = useState(false);

  useEffect(() => {
    if (navigateToNotes) {
      setNavigateToNotes(false);
      navigate(ROUTES.NOTES, { replace: true });
    }
  }, [navigateToNotes, navigate]);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const res = await api.get(`/notes/${id}`);
        const data = res.data?.data ?? res.data;
        if (!cancelled && data) {
          setNote(data);
          setFormData({
            title: data.title ?? '',
            content: data.content ?? '',
            reminderAt: data.reminderAt
              ? new Date(data.reminderAt).toISOString().slice(0, 16)
              : '',
            followUp: data.followUp ?? 'NONE',
          });
        }
      } catch (err: unknown) {
        const e = err as { response?: { status: number } };
        if (!cancelled) {
          if (e.response?.status === 404) navigate(ROUTES.NOTES, { replace: true });
          else {
            setLoadError(true);
            toast.error('Failed to load note');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim() || undefined,
        reminderAt: formData.reminderAt ? new Date(formData.reminderAt).toISOString() : null,
        followUp: formData.followUp,
      };
      if (isNew) {
        await api.post('/notes', payload);
        toast.success('Note created');
        setNavigateToNotes(true);
      } else {
        await api.put(`/notes/${id}`, payload);
        toast.success('Note updated');
        setNavigateToNotes(true);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Note deleted');
      navigate(ROUTES.NOTES, { replace: true });
    } catch {
      toast.error('Failed to delete note');
    }
  };

  if (loading && !isNew) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (loadError && !isNew) {
    return (
      <DelightfulError
        onRetry={() => {
          setLoadError(false);
          setLoading(true);
          api.get(`/notes/${id}`)
            .then((res) => {
              const data = res.data?.data ?? res.data;
              if (data) {
                setNote(data);
                setFormData({
                  title: data.title ?? '',
                  content: data.content ?? '',
                  reminderAt: data.reminderAt ? new Date(data.reminderAt).toISOString().slice(0, 16) : '',
                  followUp: data.followUp ?? 'NONE',
                });
              }
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.NOTES)}
          className="min-h-touch min-w-touch flex items-center justify-center p-1"
          aria-label="Back to notes"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">
          {isNew ? 'New note' : (note?.title || 'Note')}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <FormField label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Note title"
            required
          />
        </FormField>
        <FormField label="Content">
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Add details..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </FormField>
        <FormField label="Reminder">
          <Input
            type="datetime-local"
            value={formData.reminderAt}
            onChange={(e) => setFormData({ ...formData, reminderAt: e.target.value })}
          />
        </FormField>
        <FormField label="Follow-up">
          <Select
            value={formData.followUp}
            onChange={(v) => setFormData({ ...formData, followUp: v as Note['followUp'] })}
            options={FOLLOW_UP_OPTIONS}
          />
        </FormField>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>
            {isNew ? 'Create' : 'Save'}
          </Button>
          {!isNew && (
            <Button type="button" variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.NOTES)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NoteDetail;
