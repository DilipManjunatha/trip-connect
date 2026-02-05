import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, User } from '../../types';
import { apiService } from '../../services/api';
import { theme } from '../../theme';
import DelightfulError from '../../components/DelightfulError';
import { useAuth } from '../../context/AuthContext';
import { ActionSheet, GroupedList, LargeTitleHeader, ListRow } from '../../components/apple';
import { Text } from 'react-native-paper';

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
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    apiService
      .updateUserRole(user.id, newRole)
      .then(() => fetchUser())
      .catch(() => {});
  };

  const handleDeleteUser = () => {
    if (!user) return;
    apiService
      .deleteUser(user.id)
      .then(() => navigation.goBack())
      .catch(() => {});
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
      <LargeTitleHeader title="User" />

      <GroupedList title="Profile">
        <ListRow
          title={`${user.firstName} ${user.lastName}${isCurrentUser ? ' (You)' : ''}`}
          subtitle={`${user.email} • @${user.username}`}
          left={
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarTextSmall}>
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </Text>
            </View>
          }
          right={
            !isCurrentUser ? (
              <Icon name="dots-horizontal" size={20} color="#6B7280" onPress={() => setShowActions(true)} />
            ) : null
          }
          showChevron={false}
          isLast
        />
      </GroupedList>

      {user._count ? (
        <GroupedList title="Activity">
          <ListRow title="Contacts" subtitle={`${user._count.contacts}`} showChevron={false} isLast={false} />
          <ListRow title="Trips" subtitle={`${user._count.tripGroups}`} showChevron={false} isLast={false} />
          <ListRow title="Messages" subtitle={`${user._count.messages}`} showChevron={false} isLast={false} />
          <ListRow title="Memberships" subtitle={`${user._count.groupMembers}`} showChevron={false} isLast />
        </GroupedList>
      ) : null}

      <GroupedList title="Account">
        <ListRow
          title="Role"
          subtitle={user.role}
          showChevron={false}
          isLast={false}
        />
        <ListRow
          title="Joined"
          subtitle={new Date(user.createdAt).toLocaleDateString()}
          showChevron={false}
          isLast={false}
        />
        <ListRow
          title="Last updated"
          subtitle={new Date(user.updatedAt).toLocaleDateString()}
          showChevron={false}
          isLast
        />
      </GroupedList>

      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        title={`${user.firstName} ${user.lastName}`}
      >
        <View>
          <Text
            style={styles.sheetItem}
            onPress={() => {
              setShowActions(false);
              handleToggleRole();
            }}
          >
            {user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
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

      <ActionSheet visible={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete user?">
        <View>
          <Text style={styles.sheetHelp}>
            This action cannot be undone and may delete associated data.
          </Text>
          <Text
            style={[styles.sheetItem, styles.destructive]}
            onPress={() => {
              setShowDeleteConfirm(false);
              handleDeleteUser();
            }}
          >
            Confirm delete
          </Text>
        </View>
      </ActionSheet>
    </ScrollView>
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
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
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

export default UserDetailScreen;
