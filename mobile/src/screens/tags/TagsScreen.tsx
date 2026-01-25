import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, FAB, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { Tag, RootStackParamList } from '../../types';
import DelightfulError from '../../components/DelightfulError';
import EmptyState from '../../components/EmptyState';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type TagsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Tags'>;

const TagsScreen: React.FC = () => {
  const navigation = useNavigation<TagsScreenNavigationProp>();

  const { data: tags, isLoading, refetch, error } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiService.getTags(),
  });

  const errorObj = error as any;
  const isNetworkError = errorObj?.isNetworkError || 
    (!errorObj?.response && (errorObj?.code === 'ERR_NETWORK' || errorObj?.message?.includes('Network')));

  if (isNetworkError && !isLoading) {
    return <DelightfulError onRetry={() => refetch()} />;
  }

  const renderTag = ({ item }: { item: Tag }) => (
    <Card
      style={styles.tagCard}
      onPress={() => navigation.navigate('TagForm', { tagId: item.id })}
    >
      <Card.Content style={styles.tagContent}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        <View style={styles.tagInfo}>
          <Text variant="titleMedium">{item.name}</Text>
          {item.value && (
            <Text variant="bodySmall" style={styles.tagValue}>
              Value: {item.value}
            </Text>
          )}
          {item.description && (
            <Text variant="bodySmall" style={styles.description}>
              {item.description}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tags}
        renderItem={renderTag}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          !isLoading && (
            <EmptyState
              icon={<Icon name="tag-outline" size={64} color="#9CA3AF" />}
              title="No tags yet"
              description="Tags help you organize contacts into categories. When you create a tag and assign it to contacts, a Smart List is automatically created!"
              actionButton={{
                label: "Create Your First Tag",
                onPress: () => navigation.navigate('TagForm', {})
              }}
              examples={[
                "Language: Spanish - for Spanish speakers",
                "Skill: Photography - for photographers",
                "Status: VIP - for important contacts"
              ]}
            />
          )
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('TagForm', {})}
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
  tagCard: {
    marginBottom: 12,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
  },
  tagInfo: {
    flex: 1,
  },
  tagValue: {
    color: '#6B7280',
    marginTop: 4,
  },
  description: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
  },
});

export default TagsScreen;
