import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, User } from '../../types';
import { apiService } from '../../services/api';
import { theme } from '../../theme';
import DelightfulError from '../../components/DelightfulError';
import { useAuth } from '../../context/AuthContext';

type UserDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserDetail'
>;
type UserDetailScreenRouteProp = RouteProp<RootStackParamList, 'UserDetail'>;

interface Props {
  navigation: UserDetailScreenNavigationProp;
  route: UserDetailScreenRouteProp;
}

const UserDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setError(null);
      const data = await apiService.getUser(userId);
      setUser(data);
    } catch (err: any) {
      if (err.isNetworkError) {
        setError(new Error('Unable to connect to server'));
      } else {
        setError(err);
        Alert.alert('Error', 'Failed to fetch user details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = () => {
    if (!user) return;

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
              fetchUser();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update role');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = () => {
    if (!user) return;

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
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  if (error) {
    return <DelightfulError error={error} onRetry={fetchUser} />;
  }

  if (loading || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isCurrentUser = user.id === currentUser?.id;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {user.avatar ? (
            <Icon name="account" size={64} color={theme.colors.primary} />
          ) : (
            <Text style={styles.avatarText}>
              {user.firstName[0]}
              {user.lastName[0]}
            </Text>
          )}
        </View>
        <Text style={styles.name}>
          {user.firstName} {user.lastName}
        </Text>
        {isCurrentUser && <Text style={styles.youBadge}>(You)</Text>}

        <View
          style={[
            styles.roleBadge,
            user.role === 'ADMIN' ? styles.adminBadge : styles.userBadge,
          ]}
        >
          <Icon
            name={user.role === 'ADMIN' ? 'shield-check' : 'account'}
            size={16}
            color={user.role === 'ADMIN' ? '#059669' : '#2563eb'}
          />
          <Text
            style={[
              styles.roleText,
              user.role === 'ADMIN' ? styles.adminText : styles.userText,
            ]}
          >
            {user.role}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoRow}>
          <Icon name="email" size={20} color="#6b7280" />
          <Text style={styles.infoText}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="at" size={20} color="#6b7280" />
          <Text style={styles.infoText}>@{user.username}</Text>
        </View>
      </View>

      {user._count && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="account-group" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{user._count.contacts}</Text>
              <Text style={styles.statLabel}>Contacts</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="airplane" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{user._count.tripGroups}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="message" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{user._count.messages}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="account-multiple" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{user._count.groupMembers}</Text>
              <Text style={styles.statLabel}>Memberships</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.infoRow}>
          <Icon name="calendar" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            Joined: {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="update" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            Last Updated: {new Date(user.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {!isCurrentUser && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              user.role === 'ADMIN' ? styles.demoteButton : styles.promoteButton,
            ]}
            onPress={handleToggleRole}
          >
            <Icon
              name={user.role === 'ADMIN' ? 'account' : 'shield-check'}
              size={20}
              color="#fff"
            />
            <Text style={styles.actionButtonText}>
              {user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteUser}
          >
            <Icon name="delete" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Delete User</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  youBadge: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 8,
  },
  adminBadge: {
    backgroundColor: '#d1fae5',
  },
  userBadge: {
    backgroundColor: '#dbeafe',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  adminText: {
    color: '#059669',
  },
  userText: {
    color: '#2563eb',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
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
  actions: {
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  promoteButton: {
    backgroundColor: '#059669',
  },
  demoteButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserDetailScreen;
