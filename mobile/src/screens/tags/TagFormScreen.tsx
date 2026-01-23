import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { Tag, RootStackParamList } from '../../types';

type TagFormScreenRouteProp = RouteProp<RootStackParamList, 'TagForm'>;
type TagFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TagForm'>;

const TagFormScreen: React.FC = () => {
  const route = useRoute<TagFormScreenRouteProp>();
  const navigation = useNavigation<TagFormScreenNavigationProp>();
  const { tagId } = route.params || {};
  const queryClient = useQueryClient();
  const isEditing = !!tagId;

  const [formData, setFormData] = useState({
    name: '',
    value: '',
    color: '#3B82F6',
    description: '',
  });

  const { data: tag } = useQuery({
    queryKey: ['tag', tagId],
    queryFn: () => apiService.getTag(tagId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name,
        value: tag.value || '',
        color: tag.color,
        description: tag.description || '',
      });
    }
  }, [tag]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Tag>) => apiService.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      navigation.goBack();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Tag>) => apiService.updateTag(tagId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag', tagId] });
      navigation.goBack();
    },
  });

  const handleSubmit = () => {
    if (!formData.name) {
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
            label="Tag Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Value (optional)"
            value={formData.value}
            onChangeText={(text) => setFormData({ ...formData, value: text })}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Spanish, Photography"
          />

          <TextInput
            label="Color"
            value={formData.color}
            onChangeText={(text) => setFormData({ ...formData, color: text })}
            mode="outlined"
            style={styles.input}
            placeholder="#3B82F6"
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

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            {isEditing ? 'Update Tag' : 'Create Tag'}
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

export default TagFormScreen;
