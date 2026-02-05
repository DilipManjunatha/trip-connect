import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, Portal, Modal, TextInput, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import { apiService } from '../../services/api';
import { RootStackParamList, Itinerary } from '../../types';
import { theme } from '../../theme';

type ItineraryScreenRouteProp = RouteProp<RootStackParamList, 'Itinerary'>;

const ItineraryScreen: React.FC = () => {
  const route = useRoute<ItineraryScreenRouteProp>();
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Itinerary | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startTime: new Date(),
    endTime: new Date(),
    cost: '',
    notes: '',
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const { data: itineraries = [], isLoading } = useQuery({
    queryKey: ['itineraries', groupId],
    queryFn: () => apiService.getItineraries(groupId),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiService.createItinerary(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries', groupId] });
      handleCloseModal();
      Alert.alert('Success', 'Itinerary item created');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create itinerary item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiService.updateItinerary(groupId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries', groupId] });
      handleCloseModal();
      Alert.alert('Success', 'Itinerary item updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteItinerary(groupId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries', groupId] });
      Alert.alert('Success', 'Itinerary item deleted');
    },
  });

  const handleOpenModal = (item?: Itinerary) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        location: item.location || '',
        startTime: new Date(item.startTime),
        endTime: item.endTime ? new Date(item.endTime) : new Date(),
        cost: item.cost?.toString() || '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        location: '',
        startTime: new Date(),
        endTime: new Date(),
        cost: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      Alert.alert('Validation Error', 'Title is required');
      return;
    }

    const submitData = {
      title: formData.title,
      description: formData.description || undefined,
      location: formData.location || undefined,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      notes: formData.notes || undefined,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (item: Itinerary) => {
    Alert.alert('Delete Item', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(item.id),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {itineraries.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar-clock" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No itinerary items yet</Text>
            <Text style={styles.emptySubtext}>Add your first activity or event</Text>
          </View>
        ) : (
          itineraries.map((item) => (
            <Card key={item.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.cardActions}>
                    <Button mode="text" onPress={() => handleOpenModal(item)} compact>
                      Edit
                    </Button>
                    <Button
                      mode="text"
                      textColor="#EF4444"
                      onPress={() => handleDelete(item)}
                      compact
                    >
                      Delete
                    </Button>
                  </View>
                </View>

                {item.description && (
                  <Text style={styles.description}>{item.description}</Text>
                )}

                <View style={styles.infoRow}>
                  <Icon name="clock-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {new Date(item.startTime).toLocaleString()}
                    {item.endTime && ` - ${new Date(item.endTime).toLocaleTimeString()}`}
                  </Text>
                </View>

                {item.location && (
                  <View style={styles.infoRow}>
                    <Icon name="map-marker" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{item.location}</Text>
                  </View>
                )}

                {item.cost && (
                  <View style={styles.infoRow}>
                    <Icon name="currency-usd" size={16} color="#10B981" />
                    <Text style={[styles.infoText, { color: '#10B981', fontWeight: '600' }]}>
                      ${item.cost.toFixed(2)}
                    </Text>
                  </View>
                )}

                {item.notes && (
                  <Text style={styles.notes}>Note: {item.notes}</Text>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16, right: insets.right + 16 }]}
        onPress={() => handleOpenModal()}
        color="#fff"
      />

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={handleCloseModal}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>
            {editingItem ? 'Edit Itinerary Item' : 'Add Itinerary Item'}
          </Text>

          <ScrollView>
            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              label="Location"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              mode="outlined"
              style={styles.input}
            />

            <Button mode="outlined" onPress={() => setShowStartTimePicker(true)} style={styles.input}>
              Start: {formData.startTime.toLocaleString()}
            </Button>

            <Button mode="outlined" onPress={() => setShowEndTimePicker(true)} style={styles.input}>
              End: {formData.endTime.toLocaleString()}
            </Button>

            <TextInput
              label="Cost"
              value={formData.cost}
              onChangeText={(text) => setFormData({ ...formData, cost: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Notes"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={handleCloseModal} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={{ flex: 1, marginLeft: 8 }}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </View>
          </ScrollView>

          <DatePicker
            modal
            open={showStartTimePicker}
            date={formData.startTime}
            onConfirm={(date) => {
              setFormData({ ...formData, startTime: date });
              setShowStartTimePicker(false);
            }}
            onCancel={() => setShowStartTimePicker(false)}
            mode="datetime"
          />

          <DatePicker
            modal
            open={showEndTimePicker}
            date={formData.endTime}
            onConfirm={(date) => {
              setFormData({ ...formData, endTime: date });
              setShowEndTimePicker(false);
            }}
            onCancel={() => setShowEndTimePicker(false)}
            mode="datetime"
          />
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  notes: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  fab: {
    position: 'absolute',
    backgroundColor: theme.colors.primary,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  input: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
});

export default ItineraryScreen;
