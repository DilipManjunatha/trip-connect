import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from './utils/auth';
import prisma from './utils/prisma';

// Routes
import authRoutes from './routes/auth';
import contactRoutes from './routes/contacts';
import tagRoutes from './routes/tags';
import listRoutes from './routes/lists';
import groupRoutes from './routes/groups';
import itineraryRoutes from './routes/itineraries';
import expenseRoutes from './routes/expenses';
import messageRoutes from './routes/messages';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const server = createServer(app);

// Socket.io configuration with improved CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.io authentication middleware
io.use(async (socket: Socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return next(new Error('Authentication error: Invalid token'));
    }

    // Attach user to socket
    (socket as any).user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handling with authentication
io.on('connection', async (socket: Socket) => {
  const user = (socket as any).user;
  console.log(`User connected: ${user.email} (${socket.id})`);

  // Handle joinGroup (camelCase for consistency)
  socket.on('joinGroup', async (groupId: string) => {
    try {
      if (!groupId || typeof groupId !== 'string') {
        socket.emit('error', { message: 'Invalid group ID' });
        return;
      }

      // Verify user has access to this group
      const groupMember = await prisma.groupMember.findFirst({
        where: {
          groupId,
          OR: [
            { userId: user.id },
            { contact: { createdById: user.id } }
          ]
        }
      });

      if (!groupMember) {
        socket.emit('error', { message: 'You do not have access to this group' });
        return;
      }

      socket.join(groupId);
      console.log(`User ${user.email} joined group ${groupId}`);
      socket.emit('joinedGroup', { groupId });
    } catch (error) {
      console.error('Error joining group:', error);
      socket.emit('error', { message: 'Failed to join group' });
    }
  });

  // Handle leaveGroup (camelCase)
  socket.on('leaveGroup', (groupId: string) => {
    try {
      socket.leave(groupId);
      console.log(`User ${user.email} left group ${groupId}`);
      socket.emit('leftGroup', { groupId });
    } catch (error) {
      console.error('Error leaving group:', error);
      socket.emit('error', { message: 'Failed to leave group' });
    }
  });

  // Handle sendMessage (for direct socket messaging)
  socket.on('sendMessage', async (data: { content: string; groupId: string; type?: string }) => {
    try {
      const { content, groupId, type = 'TEXT' } = data;

      if (!content || !groupId) {
        socket.emit('error', { message: 'Content and groupId are required' });
        return;
      }

      // Verify user has access to this group
      const groupMember = await prisma.groupMember.findFirst({
        where: {
          groupId,
          OR: [
            { userId: user.id },
            { contact: { createdById: user.id } }
          ]
        }
      });

      if (!groupMember) {
        socket.emit('error', { message: 'You do not have access to this group' });
        return;
      }

      // Validate and cast message type
      const validTypes = ['TEXT', 'IMAGE', 'FILE', 'ANNOUNCEMENT'] as const;
      const messageType = (validTypes.includes(type as any) ? type : 'TEXT') as 'TEXT' | 'IMAGE' | 'FILE' | 'ANNOUNCEMENT';

      // Create message
      const message = await prisma.message.create({
        data: {
          content,
          type: messageType,
          groupId,
          senderId: user.id
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      // Broadcast to group (camelCase event name)
      io.to(groupId).emit('newMessage', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Legacy support for kebab-case events
  socket.on('join-group', (groupId: string) => {
    socket.emit('joinGroup', groupId);
  });

  socket.on('leave-group', (groupId: string) => {
    socket.emit('leaveGroup', groupId);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${user.email} (${socket.id})`);
  });
});

// Make io available to routes
app.set('socketio', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups/:groupId/itineraries', itineraryRoutes);
app.use('/api/groups/:groupId/expenses', expenseRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TripConnect API is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});