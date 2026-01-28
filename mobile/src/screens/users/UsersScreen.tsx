import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, User, UserStats } from '../../types';
import { apiService } from '../../services/api';
import { theme } from '../../theme';
import DelightfulError from '../../components/DelightfulError';
import { useAuth } from '../../context/AuthContext';
import { ActionSheet, GroupedList, LargeTitleHeader, ListRow, SearchField } from '../../components/apple';
import { Text } from 'react-native-paper';

type UsersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Users'>;

interface Props {
  navigation: UsersScreenNavigationProp;
}

const UsersScreen: React.FC<Props> = ({ navigation }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const [usersData, statsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getUserStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err: any) {
      if (err.isNetworkError) {
        setError(new Error('Unable to connect to server'));
      } else {
        setError(err);
        Alert.alert('Error', 'Failed to fetch users');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleRole = (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    apiService
      .updateUserRole(user.id, newRole)
      .then(() => fetchUsers())
      .catch(() => {});
  };

  const handleDeleteUser = (user: User) => {
    apiService
      .deleteUser(user.id)
      .then(() => fetchUsers())
      .catch(() => {});
  };

  if (error) {
    return <DelightfulError error={error} onRetry={fetchUsers} />;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LargeTitleHeader title="Users" />
      <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search users" />

      <GroupedList>
        <FlatList
          data={users.filter((u) => {
            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;
            return (
              `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q) ||
              u.username.toLowerCase().includes(q)
            );
          })}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
          }
          renderItem={({ item, index, separators }) => {
            const isCurrentUser = item.id === currentUser?.id;
            return (
              <ListRow
                title={`${item.firstName} ${item.lastName}${isCurrentUser ? ' (You)' : ''}`}
                subtitle={`${item.email} • @${item.username} • ${item.role}`}
                left={
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>
                      {item.firstName?.[0]}
                      {item.lastName?.[0]}
                    </Text>
                  </View>
                }
                right={
                  !isCurrentUser ? (
                    <Icon
                      name="dots-horizontal"
                      size={20}
                      color="#6B7280"
                      onPress={() => {
                        setSelectedUser(item);
                        setShowActions(true);
                      }}
                    />
                  ) : null
                }
                onPress={() => navigation.navigate('UserDetail', { userId: item.id })}
                showChevron
                isLast={index === users.length - 1}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="account-group" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      </GroupedList>

      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        title={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Actions'}
      >
        <View>
          <Text
            style={styles.sheetItem}
            onPress={() => {
              if (!selectedUser) return;
              setShowActions(false);
              handleToggleRole(selectedUser);
            }}
          >
            {selectedUser?.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
          </Text>
          <Text
            style={styles.sheetItem}
            onPress={() => {
              if (!selectedUser) return;
              setShowActions(false);
              navigation.navigate('UserDetail', { userId: selectedUser.id });
            }}
          >
            View details
          </Text>
          <Text
            style={[styles.sheetItem, styles.destructive]}
            onPress={() => {
              setShowActions(false);
              setShowDeleteConfirm(true);
            }}
          >
            Delete
          </Text>
        </View>
      </ActionSheet>

      <ActionSheet
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete user?"
      >
        <View>
          <Text style={styles.sheetHelp}>
            This action cannot be undone and may delete associated data.
          </Text>
          <Text
            style={[styles.sheetItem, styles.destructive]}
            onPress={() => {
              if (!selectedUser) return;
              setShowDeleteConfirm(false);
              handleDeleteUser(selectedUser);
            }}
          >
            Confirm delete
          </Text>
        </View>
      </ActionSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  sheetItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#111827',
  },
  destructive: {
    color: '#EF4444',
    fontWeight: '700',
  },
  sheetHelp: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 13,
    color: '#6B7280',
  },
});

export default UsersScreen;
