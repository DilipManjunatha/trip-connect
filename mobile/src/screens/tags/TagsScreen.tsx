import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { Tag, RootStackParamList } from '../../types';
import DelightfulError from '../../components/DelightfulError';
import EmptyState from '../../components/EmptyState';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GroupedList, LargeTitleHeader, ListRow, SearchField } from '../../components/apple';

type TagsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Tags'>;

const TagsScreen: React.FC = () => {
  const navigation = useNavigation<TagsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: tags = [], isLoading, refetch, error } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiService.getTags(),
  });

  const errorObj = error as any;
  const isNetworkError = errorObj?.isNetworkError || 
    (!errorObj?.response && (errorObj?.code === 'ERR_NETWORK' || errorObj?.message?.includes('Network')));

  if (isNetworkError && !isLoading) {
    return <DelightfulError onRetry={() => refetch()} />;
  }

  const filtered = tags.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.value || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <LargeTitleHeader title="Tags" />
      <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search tags" />

      <GroupedList>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
          renderItem={({ item, index }) => (
            <ListRow
              title={item.name}
              subtitle={[
                item.value ? `Value: ${item.value}` : null,
                item.description ? item.description : null,
              ].filter(Boolean).join(' • ') || undefined}
              left={<View style={[styles.colorIndicator, { backgroundColor: item.color }]} />}
              onPress={() => navigation.navigate('TagForm', { tagId: item.id })}
              showChevron
              isLast={index === filtered.length - 1}
            />
          )}
          contentContainerStyle={filtered.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            !isLoading ? (
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
            ) : null
          }
        />
      </GroupedList>
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16, right: insets.right + 16 }]}
        onPress={() => navigation.navigate('TagForm', {})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  emptyList: {
    minHeight: 240,
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  fab: {
    position: 'absolute',
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
