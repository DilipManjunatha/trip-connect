export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  _count?: {
    contacts: number;
    tripGroups: number;
    messages: number;
    groupMembers: number;
  };
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  tags?: ContactTag[];
  groupMembers?: GroupMember[];
  lists?: ListMember[];
  _count?: {
    groupMembers: number;
    lists: number;
  };
}

export interface Tag {
  id: string;
  name: string;
  value?: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  contacts?: ContactTag[];
  lists?: List[];
  _count?: {
    contacts: number;
    lists: number;
  };
}

export interface ContactTag {
  id: string;
  contactId: string;
  tagId: string;
  contact?: Contact;
  tag?: Tag;
}

export interface List {
  id: string;
  name: string;
  description?: string;
  isAutomatic: boolean;
  tagId?: string;
  createdAt: string;
  updatedAt: string;
  tag?: Tag;
  members?: ListMember[];
  _count?: {
    members: number;
  };
}

export interface ListMember {
  id: string;
  listId: string;
  contactId: string;
  list?: List;
  contact?: Contact;
}

export interface TripGroup {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status: 'PLANNING' | 'CONFIRMED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: User;
  members?: GroupMember[];
  itineraries?: Itinerary[];
  expenses?: Expense[];
  messages?: Message[];
  _count?: {
    members: number;
    itineraries: number;
    expenses: number;
    messages: number;
  };
}

export interface GroupMember {
  id: string;
  groupId: string;
  contactId?: string;
  userId?: string;
  role: 'ORGANIZER' | 'CO_ORGANIZER' | 'MEMBER' | 'VOLUNTEER';
  joinedAt: string;
  isConfirmed: boolean;
  group?: TripGroup;
  contact?: Contact;
  user?: User;
}

export interface Itinerary {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  group?: TripGroup;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  paidBy?: string;
  splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  date: string;
  createdAt: string;
  updatedAt: string;
  group?: TripGroup;
}

export interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'ANNOUNCEMENT';
  groupId?: string;
  senderId: string;
  createdAt: string;
  updatedAt: string;
  group?: TripGroup;
  sender?: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: PaginationMeta;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ContactForm {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tagIds?: string[];
}

export interface TagForm {
  name: string;
  value?: string;
  color?: string;
  description?: string;
}

export interface GroupForm {
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  contactIds?: string[];
  userIds?: string[];
}