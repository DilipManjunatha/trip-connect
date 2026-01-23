import api from './api';
import {
  User,
  Contact,
  Tag,
  List,
  TripGroup,
  Message,
  Itinerary,
  Expense,
  ApiResponse,
  PaginatedResponse,
  LoginForm,
  RegisterForm,
  ContactForm,
  TagForm,
  GroupForm
} from '../types';

// Auth API
export const authAPI = {
  login: async (data: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Contacts API
export const contactsAPI = {
  getContacts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tagId?: string;
  }): Promise<PaginatedResponse<Contact>> => {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  getContact: async (id: string): Promise<ApiResponse<{ contact: Contact }>> => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  createContact: async (data: ContactForm): Promise<ApiResponse<{ contact: Contact }>> => {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  updateContact: async (id: string, data: ContactForm): Promise<ApiResponse<{ contact: Contact }>> => {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },

  deleteContact: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },
};

// Tags API
export const tagsAPI = {
  getTags: async (search?: string): Promise<ApiResponse<{ tags: Tag[] }>> => {
    const response = await api.get('/tags', { params: { search } });
    return response.data;
  },

  getTag: async (id: string): Promise<ApiResponse<{ tag: Tag }>> => {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  },

  createTag: async (data: TagForm): Promise<ApiResponse<{ tag: Tag }>> => {
    const response = await api.post('/tags', data);
    return response.data;
  },

  updateTag: async (id: string, data: TagForm): Promise<ApiResponse<{ tag: Tag }>> => {
    const response = await api.put(`/tags/${id}`, data);
    return response.data;
  },

  deleteTag: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  },
};

// Lists API
export const listsAPI = {
  getLists: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isAutomatic?: boolean;
  }): Promise<PaginatedResponse<List>> => {
    const response = await api.get('/lists', { params });
    return response.data;
  },

  getList: async (id: string): Promise<ApiResponse<{ list: List }>> => {
    const response = await api.get(`/lists/${id}`);
    return response.data;
  },

  createList: async (data: { name: string; description?: string; contactIds?: string[] }): Promise<ApiResponse<{ list: List }>> => {
    const response = await api.post('/lists', data);
    return response.data;
  },

  updateList: async (id: string, data: { name: string; description?: string; contactIds?: string[] }): Promise<ApiResponse<{ list: List }>> => {
    const response = await api.put(`/lists/${id}`, data);
    return response.data;
  },

  deleteList: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/lists/${id}`);
    return response.data;
  },

  addContactToList: async (listId: string, contactId: string): Promise<ApiResponse> => {
    const response = await api.post(`/lists/${listId}/contacts`, { contactId });
    return response.data;
  },

  removeContactFromList: async (listId: string, contactId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/lists/${listId}/contacts/${contactId}`);
    return response.data;
  },
};

// Groups API
export const groupsAPI = {
  getGroups: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<TripGroup>> => {
    const response = await api.get('/groups', { params });
    return response.data;
  },

  getGroup: async (id: string): Promise<ApiResponse<{ group: TripGroup }>> => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  createGroup: async (data: GroupForm): Promise<ApiResponse<{ group: TripGroup }>> => {
    const response = await api.post('/groups', data);
    return response.data;
  },

  updateGroup: async (id: string, data: Partial<GroupForm>): Promise<ApiResponse<{ group: TripGroup }>> => {
    const response = await api.put(`/groups/${id}`, data);
    return response.data;
  },

  deleteGroup: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  addMembers: async (groupId: string, data: { contactIds?: string[]; userIds?: string[] }): Promise<ApiResponse> => {
    const response = await api.post(`/groups/${groupId}/members`, data);
    return response.data;
  },

  removeMember: async (groupId: string, memberId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  getMessages: async (params?: {
    groupId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Message>> => {
    const response = await api.get('/messages', { params });
    return response.data;
  },

  sendMessage: async (data: {
    content: string;
    type?: string;
    groupId?: string;
  }): Promise<ApiResponse<{ message: Message }>> => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  deleteMessage: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/messages/${id}`);
    return response.data;
  },
};

// Itinerary API
export const itinerariesAPI = {
  getItineraries: async (groupId: string): Promise<ApiResponse<{ itineraries: Itinerary[] }>> => {
    const response = await api.get(`/groups/${groupId}/itineraries`);
    return response.data;
  },

  createItinerary: async (groupId: string, data: {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime?: string;
    cost?: number;
    notes?: string;
  }): Promise<ApiResponse<{ itinerary: Itinerary }>> => {
    const response = await api.post(`/groups/${groupId}/itineraries`, data);
    return response.data;
  },

  updateItinerary: async (groupId: string, itineraryId: string, data: {
    title?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    cost?: number;
    notes?: string;
  }): Promise<ApiResponse<{ itinerary: Itinerary }>> => {
    const response = await api.put(`/groups/${groupId}/itineraries/${itineraryId}`, data);
    return response.data;
  },

  deleteItinerary: async (groupId: string, itineraryId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/groups/${groupId}/itineraries/${itineraryId}`);
    return response.data;
  },
};

// Expense API
export const expensesAPI = {
  getExpenses: async (groupId: string): Promise<ApiResponse<{ expenses: Expense[] }>> => {
    const response = await api.get(`/groups/${groupId}/expenses`);
    return response.data;
  },

  createExpense: async (groupId: string, data: {
    title: string;
    description?: string;
    amount: number;
    category: string;
    paidBy?: string;
    splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
    date: string;
  }): Promise<ApiResponse<{ expense: Expense }>> => {
    const response = await api.post(`/groups/${groupId}/expenses`, data);
    return response.data;
  },

  updateExpense: async (groupId: string, expenseId: string, data: {
    title?: string;
    description?: string;
    amount?: number;
    category?: string;
    paidBy?: string;
    splitType?: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
    date?: string;
  }): Promise<ApiResponse<{ expense: Expense }>> => {
    const response = await api.put(`/groups/${groupId}/expenses/${expenseId}`, data);
    return response.data;
  },

  deleteExpense: async (groupId: string, expenseId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
    return response.data;
  },
};