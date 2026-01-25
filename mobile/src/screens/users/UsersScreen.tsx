import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, User, UserStats } from '../../types';
import { apiService } from '../../services/api';
import { theme } from '../../theme';
import DelightfulError from '../../components/DelightfulError';
import { useAuth } from '../../context/AuthContext';

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
    const action = newRole === 'ADMIN' ? 'promote' : 'demote';

    Alert.alert(
      `${action === 'promote' ? 'Promote' : 'Demote'} User`,
      `Are you sure you want to ${action} ${user.firstName} ${user.lastName} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await apiService.updateUserRole(user.id, newRole);
              Alert.alert('Success', `User role updated to ${newRole}`);
              fetchUsers();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update role');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone and will delete all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const renderStatCard = (icon: string, label: string, value: number, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderUser = ({ item }: { item: User }) => {
    const isCurrentUser = item.id === currentUser?.id;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => navigation.navigate('UserDetail', { userId: item.id })}
      >
        <View style={styles.userAvatar}>
          {item.avatar ? (
            <Icon name="account" size={32} color={theme.colors.primary} />
          ) : (
            <Text style={styles.userAvatarText}>
              {item.firstName[0]}
              {item.lastName[0]}
            </Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>
              {item.firstName} {item.lastName}
            </Text>
            {isCurrentUser && <Text style={styles.youBadge}>(You)</Text>}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>

          <View style={styles.userMeta}>
            <View
              style={[
                styles.roleBadge,
                item.role === 'ADMIN' ? styles.adminBadge : styles.userBadge,
              ]}
            >
              <Icon
                name={item.role === 'ADMIN' ? 'shield-check' : 'account'}
                size={14}
                color={item.role === 'ADMIN' ? '#059669' : '#2563eb'}
              />
              <Text
                style={[
                  styles.roleText,
                  item.role === 'ADMIN' ? styles.adminText : styles.userText,
                ]}
              >
                {item.role}
              </Text>
            </View>

            {item._count && (
              <Text style={styles.activityText}>
                {item._count.contacts} contacts • {item._count.tripGroups} groups
              </Text>
            )}
          </View>
        </View>

        {!isCurrentUser && (
          <View style={styles.userActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleToggleRole(item)}
            >
              <Icon
                name={item.role === 'ADMIN' ? 'account' : 'shield-check'}
                size={20}
                color={item.role === 'ADMIN' ? '#f59e0b' : '#059669'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteUser(item)}
            >
              <Icon name="delete" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
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
      {stats && (
        <View style={styles.statsContainer}>
          {renderStatCard('account-group', 'Total Users', stats.totalUsers, theme.colors.primary)}
          {renderStatCard('shield-check', 'Admins', stats.adminUsers, '#059669')}
          {renderStatCard('account', 'Users', stats.regularUsers, '#2563eb')}
          {renderStatCard('account-clock', 'Recent', stats.recentUsers, '#8b5cf6')}
        </View>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-group" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  youBadge: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadge: {
    backgroundColor: '#d1fae5',
  },
  userBadge: {
    backgroundColor: '#dbeafe',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adminText: {
    color: '#059669',
  },
  userText: {
    color: '#2563eb',
  },
  activityText: {
    fontSize: 12,
    color: '#6b7280',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
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
});

export default UsersScreen;
