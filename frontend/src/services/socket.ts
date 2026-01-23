import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('token');

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.emit('connected', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('disconnected', { connected: false });
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socketError', error);
    });

    // Dashboard real-time updates
    this.socket.on('newContact', (data: any) => {
      this.emit('newContact', data);
    });

    this.socket.on('newGroup', (data: any) => {
      this.emit('newGroup', data);
    });

    this.socket.on('newList', (data: any) => {
      this.emit('newList', data);
    });

    this.socket.on('newTag', (data: any) => {
      this.emit('newTag', data);
    });

    this.socket.on('contactUpdated', (data: any) => {
      this.emit('contactUpdated', data);
    });

    this.socket.on('groupUpdated', (data: any) => {
      this.emit('groupUpdated', data);
    });

    this.socket.on('listUpdated', (data: any) => {
      this.emit('listUpdated', data);
    });

    this.socket.on('tagUpdated', (data: any) => {
      this.emit('tagUpdated', data);
    });

    this.socket.on('contactDeleted', (data: any) => {
      this.emit('contactDeleted', data);
    });

    this.socket.on('groupDeleted', (data: any) => {
      this.emit('groupDeleted', data);
    });

    this.socket.on('listDeleted', (data: any) => {
      this.emit('listDeleted', data);
    });

    this.socket.on('tagDeleted', (data: any) => {
      this.emit('tagDeleted', data);
    });

    // Message updates
    this.socket.on('newMessage', (data: any) => {
      this.emit('newMessage', data);
    });

    this.socket.on('messageDeleted', (data: any) => {
      this.emit('messageDeleted', data);
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
