import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, Avatar, FAB } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../services/api';
import { RootStackParamList } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DelightfulError from '../components/DelightfulError';
import { isAdmin } from '../utils/roles';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  const contactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiService.getContacts(),
    enabled: isAdmin(user), // Only fetch contacts if user is admin
  });

  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(),
  });

  const listsQuery = useQuery({
    queryKey: ['lists'],
    queryFn: () => apiService.getLists(),
    enabled: isAdmin(user), // Only fetch lists if user is admin
  });

  const contacts = contactsQuery.data;
  const groups = groupsQuery.data;
  const lists = listsQuery.data;
  const refreshing = contactsQuery.isLoading || groupsQuery.isLoading || listsQuery.isLoading;

  // Check for network errors
  const contactsError = contactsQuery.error as any;
  const groupsError = groupsQuery.error as any;
  const listsError = listsQuery.error as any;
  
  const hasNetworkError = 
    (contactsError?.isNetworkError || (!contactsError?.response && (contactsError?.code === 'ERR_NETWORK' || contactsError?.message?.includes('Network')))) ||
    (groupsError?.isNetworkError || (!groupsError?.response && (groupsError?.code === 'ERR_NETWORK' || groupsError?.message?.includes('Network')))) ||
    (listsError?.isNetworkError || (!listsError?.response && (listsError?.code === 'ERR_NETWORK' || listsError?.message?.includes('Network'))));

  const handleRefresh = () => {
    if (isAdmin(user)) {
      contactsQuery.refetch();
      listsQuery.refetch();
    }
    groupsQuery.refetch();
  };

  if (hasNetworkError && !refreshing) {
    return <DelightfulError onRetry={handleRefresh} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={64}
              label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
            />
            <View style={styles.profileInfo}>
              <Text variant="titleLarge">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text variant="bodyMedium" style={styles.email}>
                {user?.email}
              </Text>
            </View>
            <Button mode="outlined" onPress={logout} compact>
              Logout
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.statsContainer}>
          {isAdmin(user) && (
            <Card
              style={styles.statCard}
              onPress={() => navigation.navigate('ContactsTab' as any)}
            >
              <Card.Content style={styles.statContent}>
                <Icon name="account-group" size={32} color="#3B82F6" />
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {contacts?.length || 0}
                </Text>
                <Text variant="bodyMedium">Contacts</Text>
              </Card.Content>
            </Card>
          )}

          <Card
            style={styles.statCard}
            onPress={() => navigation.navigate('GroupsTab' as any)}
          >
            <Card.Content style={styles.statContent}>
              <Icon name="airplane" size={32} color="#8B5CF6" />
              <Text variant="headlineMedium" style={styles.statNumber}>
                {groups?.length || 0}
              </Text>
              <Text variant="bodyMedium">Trip Groups</Text>
            </Card.Content>
          </Card>
        </View>

        {isAdmin(user) && (
          <View style={styles.statsContainer}>
            <Card
              style={styles.statCard}
              onPress={() => navigation.navigate('ListsTab' as any)}
            >
              <Card.Content style={styles.statContent}>
                <Icon name="format-list-bulleted" size={32} color="#10B981" />
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {lists?.length || 0}
                </Text>
                <Text variant="bodyMedium">Lists</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon name="tag" size={32} color="#F59E0B" />
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {contacts?.reduce((acc, contact) => acc + (contact.tags?.length || 0), 0) || 0}
                </Text>
                <Text variant="bodyMedium">Tags Used</Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {groups && groups.length > 0 && (
          <Card style={styles.recentCard}>
            <Card.Title title="Recent Trip Groups" />
            <Card.Content>
              {groups.slice(0, 3).map((group) => (
                <Card
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => navigation.navigate('GroupsTab' as any, {
                    screen: 'GroupDetail',
                    params: { groupId: group.id }
                  })}
                >
                  <Card.Content>
                    <Text variant="titleMedium">{group.name}</Text>
                    {group.destination && (
                      <Text variant="bodySmall" style={styles.destination}>
                        {group.destination}
                      </Text>
                    )}
                    <Text variant="bodySmall" style={styles.status}>
                      Status: {group.status}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  email: {
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  recentCard: {
    margin: 16,
    marginTop: 0,
  },
  groupCard: {
    marginBottom: 8,
  },
  destination: {
    color: '#6B7280',
    marginTop: 4,
  },
  status: {
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default DashboardScreen;
