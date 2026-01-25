import api from './api';
import { User } from '../types';

// Auth services
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Alias for backward compatibility
export const authAPI = authService;

// Contact services
export const contactService = {
  getAll: async () => {
    const response = await api.get('/contacts');
    return response.data;
  },

  getContacts: async () => {
    const response = await api.get('/contacts');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },
};

// Tag services
export const tagService = {
  getAll: async () => {
    const response = await api.get('/tags');
    return response.data;
  },

  getTags: async () => {
    const response = await api.get('/tags');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/tags', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/tags/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  },
};

// List services
export const listService = {
  getAll: async () => {
    const response = await api.get('/lists');
    return response.data;
  },

  getLists: async () => {
    const response = await api.get('/lists');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/lists/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/lists', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/lists/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/lists/${id}`);
    return response.data;
  },

  addContact: async (id: string, contactId: string) => {
    const response = await api.post(`/lists/${id}/contacts`, { contactId });
    return response.data;
  },

  removeContact: async (id: string, contactId: string) => {
    const response = await api.delete(`/lists/${id}/contacts/${contactId}`);
    return response.data;
  },

  cleanup: async () => {
    const response = await api.post('/lists/cleanup');
    return response.data;
  },
};

// Group services
export const groupService = {
  getAll: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/groups', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/groups/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  addMembers: async (id: string, data: { contactIds?: string[]; userIds?: string[] }) => {
    const response = await api.post(`/groups/${id}/members`, data);
    return response.data;
  },

  removeMember: async (id: string, memberId: string) => {
    const response = await api.delete(`/groups/${id}/members/${memberId}`);
    return response.data;
  },
};

// Itinerary services
export const itineraryService = {
  getAll: async (groupId: string) => {
    const response = await api.get(`/groups/${groupId}/itineraries`);
    return response.data;
  },

  getById: async (groupId: string, id: string) => {
    const response = await api.get(`/groups/${groupId}/itineraries/${id}`);
    return response.data;
  },

  create: async (groupId: string, data: any) => {
    const response = await api.post(`/groups/${groupId}/itineraries`, data);
    return response.data;
  },

  update: async (groupId: string, id: string, data: any) => {
    const response = await api.put(`/groups/${groupId}/itineraries/${id}`, data);
    return response.data;
  },

  delete: async (groupId: string, id: string) => {
    const response = await api.delete(`/groups/${groupId}/itineraries/${id}`);
    return response.data;
  },
};

// Expense services
export const expenseService = {
  getAll: async (groupId: string) => {
    const response = await api.get(`/groups/${groupId}/expenses`);
    return response.data;
  },

  getById: async (groupId: string, id: string) => {
    const response = await api.get(`/groups/${groupId}/expenses/${id}`);
    return response.data;
  },

  create: async (groupId: string, data: any) => {
    const response = await api.post(`/groups/${groupId}/expenses`, data);
    return response.data;
  },

  update: async (groupId: string, id: string, data: any) => {
    const response = await api.put(`/groups/${groupId}/expenses/${id}`, data);
    return response.data;
  },

  delete: async (groupId: string, id: string) => {
    const response = await api.delete(`/groups/${groupId}/expenses/${id}`);
    return response.data;
  },
};

// Message services
export const messageService = {
  getAll: async (groupId?: string) => {
    const url = groupId ? `/messages?groupId=${groupId}` : '/messages';
    const response = await api.get(url);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/messages/${id}`);
    return response.data;
  },
};

// User management services
export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateRole: async (id: string, role: 'USER' | 'ADMIN') => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },

  update: async (id: string, data: Partial<User>) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },
};

// Backward compatibility aliases
export const contactsAPI = contactService;
export const tagsAPI = tagService;
export const listsAPI = listService;
export const groupsAPI = groupService;
export const itinerariesAPI = itineraryService;
export const expensesAPI = expenseService;
export const messagesAPI = messageService;
export const usersAPI = userService;

