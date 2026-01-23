import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { Contact, RootStackParamList } from '../../types';

type ListDetailScreenRouteProp = RouteProp<RootStackParamList, 'ListDetail'>;

const ListDetailScreen: React.FC = () => {
  const route = useRoute<ListDetailScreenRouteProp>();
  const { listId } = route.params;

  const { data: list, isLoading, refetch } = useQuery({
    queryKey: ['list', listId],
    queryFn: () => apiService.getList(listId),
  });

  const renderContact = ({ item }: { item: Contact }) => (
    <Card style={styles.contactCard}>
      <Card.Content style={styles.contactContent}>
        <Avatar.Text
          size={40}
          label={`${item.firstName[0]}${item.lastName[0]}`}
        />
        <View style={styles.contactInfo}>
          <Text variant="titleSmall">
            {item.firstName} {item.lastName}
          </Text>
          {item.email && (
            <Text variant="bodySmall" style={styles.email}>
              {item.email}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">{list?.name}</Text>
          {list?.description && (
            <Text variant="bodyMedium" style={styles.description}>
              {list.description}
            </Text>
          )}
          <Text variant="bodySmall" style={styles.memberCount}>
            {list?.members?.length || 0} contacts
          </Text>
        </Card.Content>
      </Card>

      <FlatList
        data={list?.members}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No contacts in this list
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  description: {
    color: '#6B7280',
    marginTop: 8,
  },
  memberCount: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  contactCard: {
    marginBottom: 8,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  email: {
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
  },
});

export default ListDetailScreen;
