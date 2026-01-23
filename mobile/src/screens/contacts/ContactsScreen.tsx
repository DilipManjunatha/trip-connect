import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, Card, Text, FAB, Avatar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { Contact, RootStackParamList } from '../../types';

type ContactsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Contacts'>;

const ContactsScreen: React.FC = () => {
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: () => apiService.getContacts({ search: searchQuery || undefined }),
  });

  const renderContact = ({ item }: { item: Contact }) => (
    <Card
      style={styles.contactCard}
      onPress={() => navigation.navigate('ContactDetail', { contactId: item.id })}
    >
      <Card.Content style={styles.contactContent}>
        <Avatar.Text
          size={48}
          label={`${item.firstName[0]}${item.lastName[0]}`}
          style={styles.avatar}
        />
        <View style={styles.contactInfo}>
          <Text variant="titleMedium">
            {item.firstName} {item.lastName}
          </Text>
          {item.email && (
            <Text variant="bodySmall" style={styles.email}>
              {item.email}
            </Text>
          )}
          {item.phone && (
            <Text variant="bodySmall" style={styles.phone}>
              {item.phone}
            </Text>
          )}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag.id}
                  style={[styles.tag, { backgroundColor: tag.color + '20' }]}
                >
                  <Text
                    variant="labelSmall"
                    style={[styles.tagText, { color: tag.color }]}
                  >
                    {tag.name}
                    {tag.value ? `: ${tag.value}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search contacts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No contacts found
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('ContactForm', {})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  contactCard: {
    marginBottom: 12,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  email: {
    color: '#6B7280',
    marginTop: 2,
  },
  phone: {
    color: '#6B7280',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
