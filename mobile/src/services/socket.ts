import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types';

const WS_URL = process.env.WS_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    const token = await AsyncStorage.getItem('token');
    
    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Handle socket errors (single registration)
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      // Emit to internal listeners for error handling
      this.emit('socketError', typeof error === 'object' && error.message ? error : { message: String(error) });
    });

    // Set up message listeners (camelCase event names)
    this.socket.on('newMessage', (message: Message) => {
      this.emit('newMessage', message);
    });

    this.socket.on('messageDeleted', (data: { messageId: string }) => {
      this.emit('messageDeleted', data.messageId);
    });

    this.socket.on('joinedGroup', (data: { groupId: string }) => {
      console.log('Joined group:', data.groupId);
    });

    this.socket.on('leftGroup', (data: { groupId: string }) => {
      console.log('Left group:', data.groupId);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  joinGroup(groupId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinGroup', groupId);
    }
  }

  leaveGroup(groupId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveGroup', groupId);
    }
  }

  sendMessage(content: string, groupId: string, type: string = 'TEXT'): void {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', { content, groupId, type });
    }
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => {
      callback(data);
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
