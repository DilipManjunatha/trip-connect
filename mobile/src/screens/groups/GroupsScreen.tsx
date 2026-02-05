import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Chip, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiService } from '../../services/api';
import { TripGroup, RootStackParamList } from '../../types';
import { theme } from '../../theme';
import DelightfulError from '../../components/DelightfulError';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../utils/roles';
import { GroupedList, LargeTitleHeader, ListRow, SearchField } from '../../components/apple';

type GroupsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Groups'>;

const statusColors: Record<string, string> = {
  PLANNING: theme.colors.primary,
  CONFIRMED: '#10B981',
  ONGOING: '#F59E0B',
  COMPLETED: '#6B7280',
  CANCELLED: '#EF4444',
};

const GroupsScreen: React.FC = () => {
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: groups = [], isLoading, refetch, error } = useQuery({
    queryKey: ['groups'],
    queryFn: apiService.getGroups,
  });

  const errorObj = error as any;
  const isNetworkError = errorObj?.isNetworkError || 
    (!errorObj?.response && (errorObj?.code === 'ERR_NETWORK' || errorObj?.message?.includes('Network')));

  if (isNetworkError && !isLoading) {
    return <DelightfulError onRetry={() => refetch()} />;
  }

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.destination?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <LargeTitleHeader title="Trips" />
      <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search groups" />

      {filteredGroups.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Icon name="airplane-off" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No trips found</Text>
          <Text style={styles.emptySubtext}>Create your first trip to get started</Text>
        </View>
      ) : (
        <GroupedList>
          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.colors.primary]} />
            }
            renderItem={({ item: group, index }) => (
              <ListRow
                title={group.name}
                subtitle={group.destination || (group.startDate ? new Date(group.startDate).toLocaleDateString() : undefined)}
                left={
                  <View style={styles.iconContainer}>
                    <Icon name="airplane" size={22} color={theme.colors.primary} />
                  </View>
                }
                right={
                  <Chip
                    style={[styles.statusChip, { backgroundColor: statusColors[group.status] }]}
                    textStyle={styles.statusText}
                  >
                    {group.status}
                  </Chip>
                }
                onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
                showChevron
                isLast={index === filteredGroups.length - 1}
              />
            )}
            contentContainerStyle={filteredGroups.length === 0 ? styles.emptyList : undefined}
          />
        </GroupedList>
      )}

      {isAdmin(user) && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom + 16, right: insets.right + 16 }]}
          onPress={() => navigation.navigate('GroupForm', {})}
          color="#fff"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  emptyList: {
    paddingBottom: 80,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChip: {
    alignSelf: 'flex-start',
    height: 24,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    backgroundColor: theme.colors.primary,
  },
});

export default GroupsScreen;
