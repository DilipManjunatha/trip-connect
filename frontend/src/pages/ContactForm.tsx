import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Contact, Tag } from '../types';
import toast from 'react-hot-toast';
import { Button, FormField, Input } from '../components/ui';
import { ROUTES } from '../ux';

const ContactForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    tagIds: [] as string[],
  });

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      fetchContact();
    }
  }, [id, isEdit]);

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      const tagsData = response.data?.data?.tags || response.data?.tags || response.data;
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };

  const fetchContact = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/contacts/${id}`);
      const contact: Contact = response.data?.data?.contact || response.data?.contact || response.data;
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        notes: contact.notes || '',
        tagIds: contact.tags ? contact.tags.map((t: { id?: string; tagId?: string }) => t.id || t.tagId || '') : [],
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load contact');
      navigate(ROUTES.CONTACTS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      if (isEdit && id) {
        await api.put(`/contacts/${id}`, payload);
        toast.success('Contact updated successfully');
      } else {
        await api.post('/contacts', payload);
        toast.success('Contact created successfully');
      }
      navigate(ROUTES.CONTACTS);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Contact' : 'New Contact'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <Input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </FormField>
          <FormField label="Last Name" required>
            <Input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </FormField>
        </div>
        <FormField label="Email">
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </FormField>
        <FormField label="Phone">
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </FormField>
        <FormField label="Address">
          <Input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </FormField>
        <FormField label="Tags">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = formData.tagIds.includes(tag.id);
              return (
                <Button
                  key={tag.id}
                  type="button"
                  variant={isSelected ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newTagIds = isSelected
                      ? formData.tagIds.filter((tid) => tid !== tag.id)
                      : [...formData.tagIds, tag.id];
                    setFormData({ ...formData, tagIds: newTagIds });
                  }}
                  style={
                    isSelected
                      ? { backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }
                      : {}
                  }
                >
                  {isSelected && (
                    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {tag.name}
                </Button>
              );
            })}
            {tags.length === 0 && <p className="text-sm text-gray-500 italic">No tags available.</p>}
          </div>
        </FormField>
        <FormField label="Notes">
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </FormField>
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.CONTACTS)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
