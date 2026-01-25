// User Types
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

export interface UserStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Contact Types
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
  tags?: Tag[];
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  value?: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// List Types
export interface List {
  id: string;
  name: string;
  description?: string;
  isAutomatic: boolean;
  tagId?: string;
  createdAt: string;
  updatedAt: string;
  tag?: Tag;
  members?: Contact[];
}

// Trip Group Types
export type TripStatus = 'PLANNING' | 'CONFIRMED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type MemberRole = 'ORGANIZER' | 'CO_ORGANIZER' | 'MEMBER' | 'VOLUNTEER';

export interface TripGroup {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status: TripStatus;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  members?: GroupMember[];
  itineraries?: Itinerary[];
  expenses?: Expense[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  contactId?: string;
  userId?: string;
  role: MemberRole;
  joinedAt: string;
  isConfirmed: boolean;
  contact?: Contact;
  user?: User;
}

// Itinerary Types
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
}

// Expense Types
export type SplitType = 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  paidBy?: string;
  splitType: SplitType;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Message Types
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'ANNOUNCEMENT';

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  groupId?: string;
  senderId: string;
  createdAt: string;
  updatedAt: string;
  sender?: User;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Contacts: undefined;
  ContactDetail: { contactId: string };
  ContactForm: { contactId?: string };
  Tags: undefined;
  TagForm: { tagId?: string };
  Lists: undefined;
  ListDetail: { listId: string };
  Groups: undefined;
  GroupDetail: { groupId: string };
  GroupForm: { groupId?: string };
  Messages: { groupId: string };
  Itinerary: { groupId: string };
  Expenses: { groupId: string };
  Users: undefined;
  UserDetail: { userId: string };
  UserForm: { userId?: string };
};
