import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { Tag } from '../types';
import { EllipsisHorizontalIcon, PencilSquareIcon, PlusIcon, TagIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import EmptyState from '../components/EmptyState';
import { useIsMobile } from '../hooks/useMediaQuery';
import { ActionSheet, BottomSheet, Button, CreateFAB, FormField, GroupedList, LargeTitleHeader, ListRow, Modal, SearchField, Input } from '../components/ui';

const Tags: React.FC = () => {
  const isMobile = useIsMobile();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    color: '#3B82F6',
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showValueField, setShowValueField] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteBlocked, setShowDeleteBlocked] = useState(false);

  const colors = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7',
    '#EC4899', '#F43F5E'
  ];

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const response = await api.get('/tags');
      console.log('Tags API response:', response.data);
      const tagsData = response.data?.data?.tags || response.data?.tags || response.data;
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error: any) {
      console.error('Fetch tags error:', error);
      // Don't show toast for 403 errors - AdminRoute will redirect
      if (error.response?.status === 403) {
        return;
      }
      if (error.isNetworkError) {
        setNetworkError(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch tags');
      }
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        value: tag.value || '',
        color: tag.color,
        description: tag.description || '',
      });
      setShowValueField(!!tag.value); // Show value field if editing and has value
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        value: '',
        color: '#3B82F6',
        description: '',
      });
      setShowValueField(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting tag payload:', formData);
      
      if (editingTag) {
        await api.put(`/tags/${editingTag.id}`, formData);
        toast.success('Tag updated successfully');
      } else {
        await api.post('/tags', formData);
        toast.success('Tag created successfully');
      }
      handleCloseModal();
      fetchTags();
    } catch (error: any) {
      console.error('Tag submit error:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save tag');
    }
  };

  const handleDelete = async (id: string) => {
    const tag = tags.find((t) => t.id === id);
    const contactCount = tag?._count?.contacts || 0;
    if (contactCount > 0) {
      setShowDeleteBlocked(true);
      return;
    }

    try {
      await api.delete(`/tags/${id}`);
      toast.success('Tag deleted successfully');
      fetchTags();
    } catch (error: any) {
      console.error('Delete tag error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete tag';
      toast.error(errorMessage);
    }
  };

  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTagsSorted = useMemo(() => {
    return [...filteredTags].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTags]);

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (networkError) {
    return <DelightfulError onRetry={() => {
      setNetworkError(false);
      fetchTags();
    }} />;
  }

  return (
    <div className="space-y-4">
      <LargeTitleHeader
        title="Tags"
        action={
          <span className="hidden md:inline-block">
            <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon className="h-5 w-5" />}>
              New
            </Button>
          </span>
        }
      />
      <CreateFAB label="Add tag" onClick={() => handleOpenModal()} />

      <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search tags" />

      {filteredTagsSorted.length > 0 ? (
        <GroupedList>
          {filteredTagsSorted.map((tag, idx) => {
            const contactCount = tag._count?.contacts || 0;
            const listCount = tag._count?.lists || 0;
            const subtitle = [
              tag.value ? tag.value : null,
              `${contactCount} contacts`,
              `${listCount} lists`,
            ]
              .filter(Boolean)
              .join(' • ');

            return (
              <div key={tag.id}>
                <ListRow
                  title={tag.name}
                  subtitle={subtitle}
                  leading={
                    <div
                      className="h-10 w-10 rounded-full ring-1 ring-black/5"
                      style={{ backgroundColor: tag.color }}
                      aria-hidden="true"
                    />
                  }
                  trailing={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedTag(tag);
                        setShowActions(true);
                      }}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100 active:bg-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Actions for ${tag.name}`}
                    >
                      <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                  }
                  onClick={() => handleOpenModal(tag)}
                  showChevron={false}
                />
                {idx !== filteredTagsSorted.length - 1 ? (
                  <div className="mx-4 h-px bg-gray-100" />
                ) : null}
              </div>
            );
          })}
        </GroupedList>
      ) : (
        <EmptyState
          icon={<TagIcon className="h-16 w-16" />}
          title="No tags yet"
          description="Create tags to categorize your contacts."
          actionButton={{
            label: "Create Your First Tag",
            onClick: () => handleOpenModal()
          }}
        />
      )}

      {isMobile ? (
        <BottomSheet
          open={showModal}
          onClose={handleCloseModal}
          onAfterClose={() => {
            setEditingTag(null);
            setShowValueField(false);
            setFormData({
              name: '',
              value: '',
              color: '#3B82F6',
              description: '',
            });
          }}
          title={editingTag ? 'Edit Tag' : 'Create New Tag'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Tag Name" required>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Tag name"
            />
          </FormField>
          
          {showValueField ? (
            <FormField label="Value (Optional)">
              <Input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Optional value"
              />
            </FormField>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowValueField(true)}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add value (optional)
            </Button>
          )}
          
          <FormField label="Color">
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`min-h-touch min-w-touch w-full aspect-square rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </FormField>
          
          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Optional description"
            />
          </FormField>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
        </BottomSheet>
      ) : (
        <Modal
          open={showModal}
          onClose={handleCloseModal}
          onAfterClose={() => {
            setEditingTag(null);
            setShowValueField(false);
            setFormData({
              name: '',
              value: '',
              color: '#3B82F6',
              description: '',
            });
          }}
          title={editingTag ? 'Edit Tag' : 'Create New Tag'}
          size="md"
        >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Tag Name" required>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Tag name"
            />
          </FormField>
          
          {/* Progressive disclosure for value field */}
          {showValueField ? (
            <FormField label="Value (Optional)">
              <Input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Optional value"
              />
            </FormField>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowValueField(true)}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add value (optional)
            </Button>
          )}
          
          <FormField label="Color">
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`min-h-touch min-w-touch w-full aspect-square rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </FormField>
          
          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Optional description"
            />
          </FormField>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
        </Modal>
      )}

      <ActionSheet
        open={showActions}
        onClose={() => setShowActions(false)}
        title={selectedTag ? selectedTag.name : 'Actions'}
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (!selectedTag) return;
              setShowActions(false);
              handleOpenModal(selectedTag);
            }}
            className="w-full min-h-touch rounded-xl bg-white py-3 text-[17px] font-medium text-gray-900 active:bg-gray-50 flex items-center"
          >
            <span className="inline-flex items-center gap-2">
              <PencilSquareIcon className="h-5 w-5 text-gray-500" />
              Edit
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedTag) return;
              const id = selectedTag.id;
              setShowActions(false);
              handleDelete(id);
            }}
            className="w-full min-h-touch rounded-xl bg-white py-3 text-[17px] font-semibold text-error-600 active:bg-gray-50 flex items-center"
          >
            <span className="inline-flex items-center gap-2">
              <TrashIcon className="h-5 w-5 text-error-500" />
              Delete
            </span>
          </button>
        </div>
      </ActionSheet>

      <ActionSheet
        open={showDeleteBlocked}
        onClose={() => setShowDeleteBlocked(false)}
        title="Can’t delete tag"
      >
        <div className="px-3 py-2 text-sm text-gray-600">
          This tag is still assigned to one or more contacts. Remove it from all contacts before deleting.
        </div>
      </ActionSheet>
    </div>
  );
};

export default Tags;
