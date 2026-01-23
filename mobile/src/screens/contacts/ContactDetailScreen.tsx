import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Avatar, Chip, Divider } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { RootStackParamList } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ContactDetailScreenRouteProp = RouteProp<RootStackParamList, 'ContactDetail'>;
type ContactDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ContactDetail'>;

const ContactDetailScreen: React.FC = () => {
  const route = useRoute<ContactDetailScreenRouteProp>();
  const navigation = useNavigation<ContactDetailScreenNavigationProp>();
  const { contactId } = route.params;
  const queryClient = useQueryClient();

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => apiService.getContact(contactId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiService.deleteContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      navigation.goBack();
    },
  });

  if (isLoading || !contact) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={`${contact.firstName[0]}${contact.lastName[0]}`}
          />
          <Text variant="headlineSmall" style={styles.name}>
            {contact.firstName} {contact.lastName}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Title title="Contact Information" />
        <Card.Content>
          {contact.email && (
            <View style={styles.infoRow}>
              <Icon name="email" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{contact.email}</Text>
            </View>
          )}
          {contact.phone && (
            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{contact.phone}</Text>
            </View>
          )}
          {contact.address && (
            <View style={styles.infoRow}>
              <Icon name="map-marker" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{contact.address}</Text>
            </View>
          )}
          {contact.notes && (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodyMedium" style={styles.notes}>
                {contact.notes}
              </Text>
            </>
          )}
        </Card.Content>
      </Card>

      {contact.tags && contact.tags.length > 0 && (
        <Card style={styles.tagsCard}>
          <Card.Title title="Tags" />
          <Card.Content>
            <View style={styles.tagsContainer}>
              {contact.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  style={[styles.tag, { backgroundColor: tag.color + '20' }]}
                  textStyle={{ color: tag.color }}
                >
                  {tag.name}
                  {tag.value ? `: ${tag.value}` : ''}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('ContactForm', { contactId })}
          style={styles.editButton}
        >
          Edit Contact
        </Button>
        <Button
          mode="outlined"
          onPress={() => deleteMutation.mutate()}
          loading={deleteMutation.isPending}
          textColor="#EF4444"
        >
          Delete Contact
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileCard: {
    margin: 16,
    marginBottom: 8,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  name: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    margin: 16,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
  },
  divider: {
    marginVertical: 16,
  },
  notes: {
    color: '#6B7280',
  },
  tagsCard: {
    margin: 16,
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginBottom: 8,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  editButton: {
    marginBottom: 8,
  },
});

export default ContactDetailScreen;
