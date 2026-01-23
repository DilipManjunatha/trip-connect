import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DatePicker from 'react-native-date-picker';
import { apiService } from '../../services/api';
import { TripGroup, RootStackParamList } from '../../types';

type GroupFormScreenRouteProp = RouteProp<RootStackParamList, 'GroupForm'>;
type GroupFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GroupForm'>;

const GroupFormScreen: React.FC = () => {
  const route = useRoute<GroupFormScreenRouteProp>();
  const navigation = useNavigation<GroupFormScreenNavigationProp>();
  const { groupId } = route.params || {};
  const queryClient = useQueryClient();
  const isEditing = !!groupId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination: '',
    startDate: new Date(),
    endDate: new Date(),
    budget: '',
    status: 'PLANNING' as TripGroup['status'],
  });

  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => apiService.getGroup(groupId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        destination: group.destination || '',
        startDate: group.startDate ? new Date(group.startDate) : new Date(),
        endDate: group.endDate ? new Date(group.endDate) : new Date(),
        budget: group.budget?.toString() || '',
        status: group.status,
      });
    }
  }, [group]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<TripGroup>) => apiService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.goBack();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<TripGroup>) => apiService.updateGroup(groupId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      navigation.goBack();
    },
  });

  const handleSubmit = () => {
    if (!formData.name) {
      return;
    }

    const submitData: Partial<TripGroup> = {
      name: formData.name,
      description: formData.description || undefined,
      destination: formData.destination || undefined,
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      status: formData.status,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
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
            label="Group Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
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
            label="Destination"
            value={formData.destination}
            onChangeText={(text) => setFormData({ ...formData, destination: text })}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="outlined"
            onPress={() => setShowStartDate(true)}
            style={styles.input}
          >
            Start Date: {formData.startDate.toLocaleDateString()}
          </Button>

          <Button
            mode="outlined"
            onPress={() => setShowEndDate(true)}
            style={styles.input}
          >
            End Date: {formData.endDate.toLocaleDateString()}
          </Button>

          <TextInput
            label="Budget"
            value={formData.budget}
            onChangeText={(text) => setFormData({ ...formData, budget: text })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <SegmentedButtons
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as TripGroup['status'] })}
            buttons={[
              { value: 'PLANNING', label: 'Planning' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'ONGOING', label: 'Ongoing' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            {isEditing ? 'Update Group' : 'Create Group'}
          </Button>
        </View>
      </ScrollView>

      <DatePicker
        modal
        open={showStartDate}
        date={formData.startDate}
        onConfirm={(date) => {
          setFormData({ ...formData, startDate: date });
          setShowStartDate(false);
        }}
        onCancel={() => setShowStartDate(false)}
      />

      <DatePicker
        modal
        open={showEndDate}
        date={formData.endDate}
        onConfirm={(date) => {
          setFormData({ ...formData, endDate: date });
          setShowEndDate(false);
        }}
        onCancel={() => setShowEndDate(false)}
      />
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

export default GroupFormScreen;
