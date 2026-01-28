import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Message, TripGroup, User } from '../types';
import { PaperAirplaneIcon, EllipsisVerticalIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';

const Messages: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [groups, setGroups] = useState<TripGroup[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Format message timestamp: show date only if not today
  const formatMessageTime = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    
    // Check if message is from today
    const isToday = 
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear();
    
    if (isToday) {
      // Today: show only time (e.g., "3:45 PM")
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      // Previous dates: show date and time (e.g., "Jan 23, 3:45 PM")
      return messageDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedGroupId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const response = await api.get('/groups');
      console.log('Groups API response:', response.data);
      const groupsData = response.data?.data?.groups || response.data?.groups || response.data;
      const groupsArray = Array.isArray(groupsData) ? groupsData : [];
      setGroups(groupsArray);
      if (groupsArray.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupsArray[0].id);
      }
    } catch (error: any) {
      console.error('Fetch groups error:', error);
      if (error.isNetworkError) {
        setNetworkError(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch groups');
      }
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedGroupId) return;
    try {
      const response = await api.get(`/messages?groupId=${selectedGroupId}`);
      console.log('Messages API response:', response.data);
      const messagesData = response.data?.data?.messages || response.data?.messages || response.data;
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroupId) return;

    try {
      const payload = {
        content: newMessage,
        groupId: selectedGroupId,
        type: 'TEXT',
      };
      console.log('Submitting message payload:', payload);
      
      setSending(true);
      await api.post('/messages', payload);
      setNewMessage('');
      fetchMessages();
    } catch (error: any) {
      console.error('Message submit error:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api.delete(`/messages/${messageId}`);
      toast.success('Message deleted');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (networkError) {
    return <DelightfulError onRetry={() => {
      setNetworkError(false);
      fetchGroups();
    }} />;
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No trip groups found</p>
        <p className="text-gray-400 text-sm mt-2">Create a trip group to start messaging</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Groups List */}
        <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="border-b border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900">Trip Groups</h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                  selectedGroupId === group.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                {group.destination && (
                  <p className="text-xs text-gray-500">{group.destination}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        {selectedGroup ? (
          <div className="lg:col-span-3 bg-white rounded-lg shadow overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedGroupId(null)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{selectedGroup.name}</h2>
                <p className="text-xs text-gray-500">
                  {selectedGroup._count?.members || 0} members
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length > 0 ? (
                <>
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === currentUser?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 group relative ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatMessageTime(message.createdAt)}
                          </p>
                          {isOwnMessage && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition inline-flex items-center gap-2"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-white rounded-lg shadow flex items-center justify-center">
            <p className="text-gray-500">Select a group to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
