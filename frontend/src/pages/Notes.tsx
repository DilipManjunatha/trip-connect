/**
 * Notes list — standalone route /notes (spec §6.8).
 * List with search; row shows title/preview, reminder date if set, follow-up state.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Note } from '../types';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { Button, CreateFAB, LargeTitleHeader, SearchField, GroupedList, ListRow } from '../components/ui';
import { noteDetail } from '../ux';

const PREVIEW_LENGTH = 60;
const FOLLOW_UP_LABELS: Record<string, string> = {
  NONE: '',
  PENDING: 'Follow-up',
  DONE: 'Done',
};

const Notes: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await api.get('/notes', { params });
      const data = response.data?.data?.notes ?? response.data?.notes ?? response.data;
      setNotes(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      const err = error as { isNetworkError?: boolean; response?: { data?: { message?: string } } };
      if (err.isNetworkError) setNetworkError(true);
      else toast.error(err.response?.data?.message ?? 'Failed to fetch notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (networkError) {
    return (
      <DelightfulError
        onRetry={() => {
          setNetworkError(false);
          fetchNotes();
        }}
      />
    );
  }

  const preview = (note: Note) => {
    const text = note.content?.trim() || note.title;
    if (!text) return '';
    return text.length <= PREVIEW_LENGTH ? text : text.slice(0, PREVIEW_LENGTH) + '…';
  };

  const reminderLabel = (note: Note) => {
    if (!note.reminderAt) return null;
    const d = new Date(note.reminderAt);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    return isToday
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  return (
    <div className="space-y-4">
      <LargeTitleHeader
        title="Notes"
        action={
          <span className="hidden md:inline-block">
            <Button onClick={() => navigate(noteDetail('new'))} leftIcon={<DocumentTextIcon className="h-5 w-5" />}>
              New
            </Button>
          </span>
        }
      />
      <CreateFAB label="Add note" onClick={() => navigate(noteDetail('new'))} />
      <SearchField
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search notes"
      />
      {notes.length > 0 ? (
        <GroupedList>
          {notes.map((note, idx) => {
            const sub = [
              note.title !== (note.content?.trim() || '') && preview(note),
              reminderLabel(note) && `Reminder: ${reminderLabel(note)}`,
              note.followUp !== 'NONE' && FOLLOW_UP_LABELS[note.followUp],
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <div key={note.id}>
                <ListRow
                  title={note.title || 'Untitled'}
                  subtitle={sub || undefined}
                  leading={<DocumentTextIcon className="h-6 w-6 text-gray-400" />}
                  trailing={
                    note.followUp === 'PENDING' ? (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        Follow-up
                      </span>
                    ) : note.followUp === 'DONE' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden />
                    ) : note.reminderAt ? (
                      <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden />
                    ) : undefined
                  }
                  onClick={() => navigate(noteDetail(note.id))}
                  showChevron
                />
                {idx < notes.length - 1 && <div className="mx-4 h-px bg-gray-100" />}
              </div>
            );
          })}
        </GroupedList>
      ) : (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No notes match your search' : 'No notes yet'}
          </p>
          {!searchTerm && (
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => navigate(noteDetail('new'))}
            >
              Create your first note
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Notes;
