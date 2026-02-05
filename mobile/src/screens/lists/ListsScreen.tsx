import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { List, RootStackParamList } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DelightfulError from '../../components/DelightfulError';
import EmptyState from '../../components/EmptyState';
import { GroupedList, LargeTitleHeader, ListRow } from '../../components/apple';

type ListsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Lists'>;

const ListsScreen: React.FC = () => {
  const navigation = useNavigation<ListsScreenNavigationProp>();

  const { data: lists = [], isLoading, refetch, error } = useQuery({
    queryKey: ['lists'],
    queryFn: () => apiService.getLists(),
  });

  const errorObj = error as any;
  const isNetworkError = errorObj?.isNetworkError || 
    (!errorObj?.response && (errorObj?.code === 'ERR_NETWORK' || errorObj?.message?.includes('Network')));

  if (isNetworkError && !isLoading) {
    return <DelightfulError onRetry={() => refetch()} />;
  }

  return (
    <View style={styles.container}>
      <LargeTitleHeader title="Smart Lists" />

      <GroupedList>
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
          renderItem={({ item, index }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.members?.length || 0} members${item.isAutomatic ? ' • Automatic' : ''}`}
              left={
                <View style={styles.iconWrap}>
                  <Icon
                    name={item.isAutomatic ? 'auto-fix' : 'format-list-bulleted'}
                    size={22}
                    color="#3B82F6"
                  />
                </View>
              }
              onPress={() => navigation.navigate('ListDetail', { listId: item.id })}
              showChevron
              isLast={index === lists.length - 1}
            />
          )}
          contentContainerStyle={lists.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                icon={<Icon name="format-list-bulleted" size={64} color="#9CA3AF" />}
                title="No lists yet"
                description="Smart lists are automatically created when you create tags and assign them to contacts. Start by creating some tags!"
                actionButton={{
                  label: "Go to Tags",
                  onPress: () => navigation.navigate('Tags')
                }}
                examples={[
                  "Create a 'Language: Spanish' tag",
                  "Assign it to contacts who speak Spanish",
                  "A Smart List is automatically created!"
                ]}
              />
            ) : null
          }
        />
      </GroupedList>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  emptyList: {
    minHeight: 220,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
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
