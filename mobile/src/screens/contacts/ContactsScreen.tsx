import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { Contact, RootStackParamList } from '../../types';
import { GroupedList, LargeTitleHeader, ListRow, SearchField } from '../../components/apple';

type ContactsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Contacts'>;

const ContactsScreen: React.FC = () => {
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contacts = [], isLoading, refetch } = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: () => apiService.getContacts({ search: searchQuery || undefined }),
  });

  return (
    <View style={styles.container}>
      <LargeTitleHeader title="Contacts" />
      <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search contacts" />

      <GroupedList>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
          renderItem={({ item, index }) => (
            <ListRow
              title={`${item.firstName} ${item.lastName}`.trim()}
              subtitle={item.email || item.phone || undefined}
              left={
                <Avatar.Text
                  size={40}
                  label={`${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`}
                />
              }
              onPress={() => navigation.navigate('ContactDetail', { contactId: item.id })}
              showChevron
              isLast={index === contacts.length - 1}
            />
          )}
          contentContainerStyle={contacts.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No contacts found</Text>
            </View>
          }
        />
      </GroupedList>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16, right: insets.right + 16 }]}
        onPress={() => navigation.navigate('ContactForm', {})}
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
    minHeight: 180,
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

export default ContactsScreen;
