import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Text, Avatar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { socketService } from '../../services/socket';
import { Message, RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import DelightfulError from '../../components/DelightfulError';

type MessagesScreenRouteProp = RouteProp<RootStackParamList, 'Messages'>;

const MessagesScreen: React.FC = () => {
  const route = useRoute<MessagesScreenRouteProp>();
  const { groupId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: messages = [], refetch, error, isLoading } = useQuery({
    queryKey: ['messages', groupId],
    queryFn: () => apiService.getMessages(groupId),
  });

  const errorObj = error as any;
  const isNetworkError = errorObj?.isNetworkError || 
    (!errorObj?.response && (errorObj?.code === 'ERR_NETWORK' || errorObj?.message?.includes('Network')));

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiService.sendMessage({ content, groupId, type: 'TEXT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
      setMessage('');
    },
  });

  useEffect(() => {
    socketService.connect();
    socketService.joinGroup(groupId);

    const unsubscribeNewMessage = socketService.on('newMessage', (newMessage: Message) => {
      if (newMessage.groupId === groupId) {
        queryClient.setQueryData(['messages', groupId], (old: Message[] = []) => {
          if (old.some((m) => m.id === newMessage.id)) {
            return old;
          }
          return [...old, newMessage];
        });
      }
    });

    const unsubscribeDeleted = socketService.on('messageDeleted', (messageId: string) => {
      queryClient.setQueryData(['messages', groupId], (old: Message[] = []) =>
        old.filter((m) => m.id !== messageId)
      );
    });

    return () => {
      socketService.leaveGroup(groupId);
      unsubscribeNewMessage();
      unsubscribeDeleted();
    };
  }, [groupId, queryClient]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (message.trim()) {
      sendMutation.mutate(message.trim());
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwn && item.sender && (
          <Avatar.Text
            size={32}
            label={`${item.sender.firstName[0]}${item.sender.lastName[0]}`}
            style={styles.avatar}
          />
        )}
        <Card
          style={[
            styles.messageCard,
            isOwn ? styles.ownMessageCard : styles.otherMessageCard,
          ]}
        >
          <Card.Content>
            {!isOwn && item.sender && (
              <Text variant="labelSmall" style={styles.senderName}>
                {item.sender.firstName} {item.sender.lastName}
              </Text>
            )}
            <Text variant="bodyMedium">{item.content}</Text>
            <Text variant="labelSmall" style={styles.timestamp}>
              {format(new Date(item.createdAt), 'HH:mm')}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  if (isNetworkError && !isLoading) {
    return <DelightfulError onRetry={() => refetch()} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          multiline
          onSubmitEditing={handleSend}
        />
        <Button
          mode="contained"
          onPress={handleSend}
          loading={sendMutation.isPending}
          disabled={!message.trim() || sendMutation.isPending}
          style={styles.sendButton}
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
  },
  messageCard: {
    maxWidth: '75%',
  },
  ownMessageCard: {
    backgroundColor: '#3B82F6',
  },
  otherMessageCard: {
    backgroundColor: '#FFFFFF',
  },
  senderName: {
    color: '#6B7280',
    marginBottom: 4,
  },
  timestamp: {
    color: '#9CA3AF',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
});

export default MessagesScreen;
