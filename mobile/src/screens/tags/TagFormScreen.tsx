import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { Tag, RootStackParamList } from '../../types';
import InfoTooltip from '../../components/InfoTooltip';
import { LargeTitleHeader } from '../../components/apple';

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
        <LargeTitleHeader title={isEditing ? 'Edit Tag' : 'New Tag'} />
        <View style={styles.content}>
          {/* Examples Section for new tags */}
          {!isEditing && (
            <Card style={styles.examplesCard}>
              <Card.Content>
                <Text variant="labelLarge" style={styles.examplesTitle}>
                  💡 Common tag patterns:
                </Text>
                <Text variant="bodySmall" style={styles.exampleText}>
                  • <Text style={styles.boldText}>Language:</Text> Spanish, English, French
                </Text>
                <Text variant="bodySmall" style={styles.exampleText}>
                  • <Text style={styles.boldText}>Skill:</Text> Photography, Cooking
                </Text>
                <Text variant="bodySmall" style={styles.exampleText}>
                  • <Text style={styles.boldText}>Status:</Text> VIP, Active, Pending
                </Text>
                <Text variant="bodySmall" style={styles.exampleText}>
                  • <Text style={styles.boldText}>Relationship:</Text> Family, Friend
                </Text>
              </Card.Content>
            </Card>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              label="Tag Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Language, Skill, Status"
            />
            <InfoTooltip content="Categories to organize contacts (e.g., Language, Skill, Status, Relationship)" />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              label="Value (optional)"
              value={formData.value}
              onChangeText={(text) => setFormData({ ...formData, value: text })}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Spanish, Photography, VIP"
            />
            <InfoTooltip content="Optional specific value (e.g., Spanish for Language tag, Photography for Skill tag)" />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              label="Color"
              value={formData.color}
              onChangeText={(text) => setFormData({ ...formData, color: text })}
              mode="outlined"
              style={styles.input}
              placeholder="#3B82F6"
            />
            <InfoTooltip content="Choose a color to visually identify this tag and its associated list" />
          </View>

          <TextInput
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {/* Info about automatic list creation */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="labelMedium" style={styles.infoTitle}>
                What happens after creation?
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                When you assign this tag to contacts, a Smart List will be automatically created. The list will update automatically as you add or remove this tag from contacts.
              </Text>
            </Card.Content>
          </Card>

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
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  examplesCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  examplesTitle: {
    marginBottom: 8,
  },
  exampleText: {
    marginTop: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  infoCard: {
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
  },
  infoTitle: {
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    color: '#3B82F6',
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
});

export default TagFormScreen;
