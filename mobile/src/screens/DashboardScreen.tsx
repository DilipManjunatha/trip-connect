import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DelightfulError from '../components/DelightfulError';
import { isAdmin } from '../utils/roles';

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(),
  });

  const groups = groupsQuery.data || [];
  const refreshing = groupsQuery.isLoading;
  const hasNetworkError = (groupsQuery.error as any)?.isNetworkError ||
    ((groupsQuery.error as any)?.code === 'ERR_NETWORK');

  if (hasNetworkError && !refreshing) {
    return <DelightfulError onRetry={() => groupsQuery.refetch()} />;
  }

  const navItems = isAdmin(user)
    ? [
        { name: 'Trips', route: 'GroupsTab', icon: 'airplane' as const },
        { name: 'Contacts', route: 'ContactsTab', icon: 'account-group' as const },
        { name: 'Tags', route: 'TagsTab', icon: 'tag' as const },
        { name: 'Smart Lists', route: 'ListsTab', icon: 'format-list-bulleted' as const },
      ]
    : [
        { name: 'Trips', route: 'GroupsTab', icon: 'airplane' as const },
        { name: 'Messages', route: 'Messages', icon: 'message' as const },
      ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => groupsQuery.refetch()} />
      }
    >
      <Text style={styles.welcome}>Hi, {user?.firstName}</Text>

      <View style={styles.grid}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.card}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Icon name={item.icon} size={24} color="#6B7280" />
            </View>
            <Text style={styles.label}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {groups.length > 0 && (
        <Text style={styles.hint}>
          {groups.length} trip{groups.length !== 1 ? 's' : ''} in your list
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F2F2F7' },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  welcome: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default DashboardScreen;
