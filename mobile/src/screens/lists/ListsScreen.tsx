import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { List, RootStackParamList } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DelightfulError from '../../components/DelightfulError';

type ListsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Lists'>;

const ListsScreen: React.FC = () => {
  const navigation = useNavigation<ListsScreenNavigationProp>();

  const { data: lists, isLoading, refetch, error } = useQuery({
    queryKey: ['lists'],
    queryFn: () => apiService.getLists(),
  });

  const errorObj = error as any;
  const isNetworkError = errorObj?.isNetworkError || 
    (!errorObj?.response && (errorObj?.code === 'ERR_NETWORK' || errorObj?.message?.includes('Network')));

  if (isNetworkError && !isLoading) {
    return <DelightfulError onRetry={() => refetch()} />;
  }

  const renderList = ({ item }: { item: List }) => (
    <Card
      style={styles.listCard}
      onPress={() => navigation.navigate('ListDetail', { listId: item.id })}
    >
      <Card.Content>
        <View style={styles.listHeader}>
          <Icon
            name={item.isAutomatic ? 'auto-fix' : 'format-list-bulleted'}
            size={24}
            color="#3B82F6"
          />
          <View style={styles.listInfo}>
            <Text variant="titleMedium">{item.name}</Text>
            {item.isAutomatic && item.tag && (
              <Chip
                icon="tag"
                style={styles.autoChip}
                textStyle={{ fontSize: 10 }}
              >
                Auto: {item.tag.name}
              </Chip>
            )}
          </View>
          <Text variant="bodyMedium" style={styles.memberCount}>
            {item.members?.length || 0} members
          </Text>
        </View>
        {item.description && (
          <Text variant="bodySmall" style={styles.description}>
            {item.description}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        renderItem={renderList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No lists found
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
  list: {
    padding: 16,
  },
  listCard: {
    marginBottom: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listInfo: {
    flex: 1,
  },
  autoChip: {
    marginTop: 4,
    height: 24,
  },
  memberCount: {
    color: '#6B7280',
  },
  description: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
  },
});

export default ListsScreen;
