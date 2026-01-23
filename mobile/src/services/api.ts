import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  AuthResponse,
  Contact,
  Tag,
  List,
  TripGroup,
  Message,
  Itinerary,
  Expense,
} from '../types';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Check if it's a network error (no response from server)
        const isNetworkError = !error.response && (
          error.code === 'ECONNABORTED' || 
          error.code === 'ERR_NETWORK' || 
          error.message === 'Network Error' ||
          error.message?.includes('Network request failed')
        );
        
        if (isNetworkError) {
          // Mark as network error for components to handle with delightful UI
          return Promise.reject({ ...error, isNetworkError: true });
        }
        
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth APIs
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
      email,
      password,
    });
    // Unwrap the response.data structure
    return response.data.data;
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> {
    const response = await this.client.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
    // Unwrap the response.data structure
    return response.data.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<User>('/auth/profile');
    return response.data;
  }

  // Contact APIs
  async getContacts(params?: {
    search?: string;
    tagId?: string;
  }): Promise<Contact[]> {
    const response = await this.client.get<{ success: boolean; data: { contacts: Contact[] } }>('/contacts', { params });
    return response.data.data.contacts;
  }

  async getContact(id: string): Promise<Contact> {
    const response = await this.client.get<{ success: boolean; data: { contact: Contact } }>(`/contacts/${id}`);
    return response.data.data.contact;
  }

  async createContact(data: Partial<Contact>): Promise<Contact> {
    const response = await this.client.post<{ success: boolean; data: { contact: Contact } }>('/contacts', data);
    return response.data.data.contact;
  }

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    const response = await this.client.put<{ success: boolean; data: { contact: Contact } }>(`/contacts/${id}`, data);
    return response.data.data.contact;
  }

  async deleteContact(id: string): Promise<void> {
    await this.client.delete(`/contacts/${id}`);
  }

  // Tag APIs
  async getTags(): Promise<Tag[]> {
    const response = await this.client.get<{ success: boolean; data: { tags: Tag[] } }>('/tags');
    return response.data.data.tags;
  }

  async getTag(id: string): Promise<Tag> {
    const response = await this.client.get<{ success: boolean; data: { tag: Tag } }>(`/tags/${id}`);
    return response.data.data.tag;
  }

  async createTag(data: Partial<Tag>): Promise<Tag> {
    const response = await this.client.post<{ success: boolean; data: { tag: Tag } }>('/tags', data);
    return response.data.data.tag;
  }

  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const response = await this.client.put<{ success: boolean; data: { tag: Tag } }>(`/tags/${id}`, data);
    return response.data.data.tag;
  }

  async deleteTag(id: string): Promise<void> {
    await this.client.delete(`/tags/${id}`);
  }

  // List APIs
  async getLists(): Promise<List[]> {
    const response = await this.client.get<{ success: boolean; data: { lists: List[] } }>('/lists');
    return response.data.data.lists;
  }

  async getList(id: string): Promise<List> {
    const response = await this.client.get<{ success: boolean; data: { list: List } }>(`/lists/${id}`);
    return response.data.data.list;
  }

  async createList(data: Partial<List>): Promise<List> {
    const response = await this.client.post<{ success: boolean; data: { list: List } }>('/lists', data);
    return response.data.data.list;
  }

  async updateList(id: string, data: Partial<List>): Promise<List> {
    const response = await this.client.put<{ success: boolean; data: { list: List } }>(`/lists/${id}`, data);
    return response.data.data.list;
  }

  async deleteList(id: string): Promise<void> {
    await this.client.delete(`/lists/${id}`);
  }

  async addContactToList(listId: string, contactId: string): Promise<void> {
    await this.client.post(`/lists/${listId}/contacts`, { contactId });
  }

  async removeContactFromList(listId: string, contactId: string): Promise<void> {
    await this.client.delete(`/lists/${listId}/contacts/${contactId}`);
  }

  // Group APIs
  async getGroups(): Promise<TripGroup[]> {
    const response = await this.client.get<{ success: boolean; data: { groups: TripGroup[] } }>('/groups');
    return response.data.data.groups;
  }

  async getGroup(id: string): Promise<TripGroup> {
    const response = await this.client.get<{ success: boolean; data: { group: TripGroup } }>(`/groups/${id}`);
    return response.data.data.group;
  }

  async createGroup(data: Partial<TripGroup>): Promise<TripGroup> {
    const response = await this.client.post<{ success: boolean; data: { group: TripGroup } }>('/groups', data);
    return response.data.data.group;
  }

  async updateGroup(id: string, data: Partial<TripGroup>): Promise<TripGroup> {
    const response = await this.client.put<{ success: boolean; data: { group: TripGroup } }>(`/groups/${id}`, data);
    return response.data.data.group;
  }

  async deleteGroup(id: string): Promise<void> {
    await this.client.delete(`/groups/${id}`);
  }

  async addMembersToGroup(groupId: string, data: { contactIds?: string[]; userIds?: string[] }): Promise<void> {
    await this.client.post(`/groups/${groupId}/members`, data);
  }

  async removeMemberFromGroup(groupId: string, memberId: string): Promise<void> {
    await this.client.delete(`/groups/${groupId}/members/${memberId}`);
  }

  // Message APIs
  async getMessages(groupId?: string): Promise<Message[]> {
    const response = await this.client.get<{ success: boolean; data: { messages: Message[] } }>('/messages', {
      params: groupId ? { groupId } : {},
    });
    return response.data.data.messages;
  }

  async sendMessage(data: { content: string; groupId?: string; type?: string }): Promise<Message> {
    const response = await this.client.post<{ success: boolean; data: { message: Message } }>('/messages', data);
    return response.data.data.message;
  }

  async deleteMessage(id: string): Promise<void> {
    await this.client.delete(`/messages/${id}`);
  }

  // Itinerary APIs
  async getItineraries(groupId: string): Promise<Itinerary[]> {
    const response = await this.client.get<{ success: boolean; data: { itineraries: Itinerary[] } }>(`/groups/${groupId}/itineraries`);
    return response.data.data.itineraries;
  }

  async createItinerary(groupId: string, data: {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime?: string;
    cost?: number;
    notes?: string;
  }): Promise<Itinerary> {
    const response = await this.client.post<{ success: boolean; data: { itinerary: Itinerary } }>(`/groups/${groupId}/itineraries`, data);
    return response.data.data.itinerary;
  }

  async updateItinerary(groupId: string, itineraryId: string, data: {
    title?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    cost?: number;
    notes?: string;
  }): Promise<Itinerary> {
    const response = await this.client.put<{ success: boolean; data: { itinerary: Itinerary } }>(`/groups/${groupId}/itineraries/${itineraryId}`, data);
    return response.data.data.itinerary;
  }

  async deleteItinerary(groupId: string, itineraryId: string): Promise<void> {
    await this.client.delete(`/groups/${groupId}/itineraries/${itineraryId}`);
  }


  // Expense APIs
  async getExpenses(groupId: string): Promise<Expense[]> {
    const response = await this.client.get<{ success: boolean; data: { expenses: Expense[] } }>(`/groups/${groupId}/expenses`);
    return response.data.data.expenses;
  }

  async createExpense(groupId: string, data: {
    title: string;
    description?: string;
    amount: number;
    category: string;
    paidBy?: string;
    splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
    date: string;
  }): Promise<Expense> {
    const response = await this.client.post<{ success: boolean; data: { expense: Expense } }>(`/groups/${groupId}/expenses`, data);
    return response.data.data.expense;
  }

  async updateExpense(groupId: string, expenseId: string, data: {
    title?: string;
    description?: string;
    amount?: number;
    category?: string;
    paidBy?: string;
    splitType?: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
    date?: string;
  }): Promise<Expense> {
    const response = await this.client.put<{ success: boolean; data: { expense: Expense } }>(`/groups/${groupId}/expenses/${expenseId}`, data);
    return response.data.data.expense;
  }

  async deleteExpense(groupId: string, expenseId: string): Promise<void> {
    await this.client.delete(`/groups/${groupId}/expenses/${expenseId}`);
  }
}

export const apiService = new ApiService();
