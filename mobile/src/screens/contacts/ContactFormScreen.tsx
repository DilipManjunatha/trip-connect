import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { Contact, RootStackParamList } from '../../types';

type ContactFormScreenRouteProp = RouteProp<RootStackParamList, 'ContactForm'>;
type ContactFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ContactForm'>;

const ContactFormScreen: React.FC = () => {
  const route = useRoute<ContactFormScreenRouteProp>();
  const navigation = useNavigation<ContactFormScreenNavigationProp>();
  const { contactId } = route.params || {};
  const queryClient = useQueryClient();
  const isEditing = !!contactId;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const { data: contact } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => apiService.getContact(contactId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        notes: contact.notes || '',
      });
    }
  }, [contact]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Contact>) => apiService.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      navigation.goBack();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Contact>) => apiService.updateContact(contactId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      navigation.goBack();
    },
  });

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName) {
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <TextInput
            label="First Name *"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Last Name *"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Phone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TextInput
            label="Address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <TextInput
            label="Notes"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            {isEditing ? 'Update Contact' : 'Create Contact'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
});

export default ContactFormScreen;
