import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip, FAB, Searchbar } from 'react-native-paper';
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

  const renderGroupCard = ({ item: group }: { item: TripGroup }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Icon name="airplane" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Chip
              style={[styles.statusChip, { backgroundColor: statusColors[group.status] }]}
              textStyle={styles.statusText}
            >
              {group.status}
            </Chip>
          </View>
        </View>

        {group.destination && (
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{group.destination}</Text>
          </View>
        )}

        {group.startDate && (
          <View style={styles.infoRow}>
            <Icon name="calendar" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {new Date(group.startDate).toLocaleDateString()}
              {group.endDate && ` - ${new Date(group.endDate).toLocaleDateString()}`}
            </Text>
          </View>
        )}

        {group.budget && (
          <View style={styles.infoRow}>
            <Icon name="currency-usd" size={16} color="#10B981" />
            <Text style={[styles.infoText, { color: '#10B981', fontWeight: '600' }]}>
              Budget: ${group.budget.toFixed(2)}
            </Text>
          </View>
        )}

        {group.description && (
          <Text style={styles.description} numberOfLines={2}>
            {group.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.stat}>
            <Icon name="account-group" size={16} color="#6B7280" />
            <Text style={styles.statText}>{group._count?.members || 0} members</Text>
          </View>
          <View style={styles.stat}>
            <Icon name="cash" size={16} color="#6B7280" />
            <Text style={styles.statText}>{group._count?.expenses || 0} expenses</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search trip groups..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {filteredGroups.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Icon name="airplane-off" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No trip groups found</Text>
          <Text style={styles.emptySubtext}>Create your first trip group to get started</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.colors.primary]} />
          }
        />
      )}

      {isAdmin(user) && (
        <FAB
          icon="plus"
          style={styles.fab}
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
    backgroundColor: '#F3F4F6',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
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
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default GroupsScreen;
