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
        {/* Welcome Header - Compact */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.firstName}!
          </Text>
        </View>

        {/* Quick Actions - Top Priority */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsGrid}>
            {isAdmin(user) && (
              <>
                <Card
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('ContactsTab' as any)}
                >
                  <Card.Content style={styles.quickActionContent}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F6' }]}>
                      <Icon name="account-plus" size={24} color="#fff" />
                    </View>
                    <Text style={styles.quickActionLabel}>Add Contact</Text>
                  </Card.Content>
                </Card>

                <Card
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('TagsTab' as any)}
                >
                  <Card.Content style={styles.quickActionContent}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#10B981' }]}>
                      <Icon name="tag-plus" size={24} color="#fff" />
                    </View>
                    <Text style={styles.quickActionLabel}>Create Tag</Text>
                  </Card.Content>
                </Card>
              </>
            )}

            <Card
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('GroupsTab' as any)}
            >
              <Card.Content style={styles.quickActionContent}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF6' }]}>
                  <Icon name="airplane-plus" size={24} color="#fff" />
                </View>
                <Text style={styles.quickActionLabel}>
                  {isAdmin(user) ? 'Create Group' : 'View Groups'}
                </Text>
              </Card.Content>
            </Card>

            {!isAdmin(user) && (
              <Card
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Messages' as any)}
              >
                <Card.Content style={styles.quickActionContent}>
                  <View style={[styles.quickActionIcon, { backgroundColor: '#6366F1' }]}>
                    <Icon name="message" size={24} color="#fff" />
                  </View>
                  <Text style={styles.quickActionLabel}>Messages</Text>
                </Card.Content>
              </Card>
            )}
          </View>
        </View>

        {/* Stats - Compact horizontal scroll */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>SUMMARY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
            {isAdmin(user) && (
              <Card
                style={styles.compactStatCard}
                onPress={() => navigation.navigate('ContactsTab' as any)}
              >
                <Card.Content style={styles.compactStatContent}>
                  <View style={[styles.compactStatIcon, { backgroundColor: '#3B82F6' }]}>
                    <Icon name="account-group" size={20} color="#fff" />
                  </View>
                  <Text style={styles.compactStatNumber}>{contacts?.length || 0}</Text>
                  <Text style={styles.compactStatLabel}>Contacts</Text>
                </Card.Content>
              </Card>
            )}

            <Card
              style={styles.compactStatCard}
              onPress={() => navigation.navigate('GroupsTab' as any)}
            >
              <Card.Content style={styles.compactStatContent}>
                <View style={[styles.compactStatIcon, { backgroundColor: '#8B5CF6' }]}>
                  <Icon name="airplane" size={20} color="#fff" />
                </View>
                <Text style={styles.compactStatNumber}>{groups?.length || 0}</Text>
                <Text style={styles.compactStatLabel}>Groups</Text>
              </Card.Content>
            </Card>

            {isAdmin(user) && (
              <>
                <Card
                  style={styles.compactStatCard}
                  onPress={() => navigation.navigate('ListsTab' as any)}
                >
                  <Card.Content style={styles.compactStatContent}>
                    <View style={[styles.compactStatIcon, { backgroundColor: '#10B981' }]}>
                      <Icon name="format-list-bulleted" size={20} color="#fff" />
                    </View>
                    <Text style={styles.compactStatNumber}>{lists?.length || 0}</Text>
                    <Text style={styles.compactStatLabel}>Lists</Text>
                  </Card.Content>
                </Card>

                <Card style={styles.compactStatCard}>
                  <Card.Content style={styles.compactStatContent}>
                    <View style={[styles.compactStatIcon, { backgroundColor: '#F59E0B' }]}>
                      <Icon name="tag" size={20} color="#fff" />
                    </View>
                    <Text style={styles.compactStatNumber}>
                      {contacts?.reduce((acc, contact) => acc + (contact.tags?.length || 0), 0) || 0}
                    </Text>
                    <Text style={styles.compactStatLabel}>Tags</Text>
                  </Card.Content>
                </Card>
              </>
            )}
          </ScrollView>
        </View>

        {/* Recent Groups - Compact */}
        {groups && groups.length > 0 && (
          <Card style={styles.recentCard}>
            <Card.Title title="Recent Trip Groups" titleStyle={styles.cardTitle} />
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
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#111827',
  },
  quickActionsSection: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  quickActionContent: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  statsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsScroll: {
    paddingRight: 16,
    gap: 8,
  },
  compactStatCard: {
    width: 100,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  compactStatContent: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  compactStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  compactStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  recentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCard: {
    marginBottom: 8,
    borderRadius: 12,
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
