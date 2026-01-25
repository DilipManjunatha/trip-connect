import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onPress: () => void;
  };
  examples?: string[];
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
  examples,
}) => {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <Text variant="headlineSmall" style={styles.title}>
        {title}
      </Text>
      
      <Text variant="bodyMedium" style={styles.description}>
        {description}
      </Text>
      
      {examples && examples.length > 0 && (
        <Card style={styles.examplesCard}>
          <Card.Content>
            <Text variant="labelLarge" style={styles.examplesTitle}>
              💡 Example use cases:
            </Text>
            {examples.map((example, index) => (
              <Text key={index} variant="bodySmall" style={styles.exampleItem}>
                • {example}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}
      
      {actionButton && (
        <Button
          mode="contained"
          onPress={actionButton.onPress}
          style={styles.button}
        >
          {actionButton.label}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
    opacity: 0.6,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 16,
    maxWidth: 300,
  },
  examplesCard: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
  },
  examplesTitle: {
    color: '#1E40AF',
    marginBottom: 8,
  },
  exampleItem: {
    color: '#3B82F6',
    marginLeft: 8,
    marginTop: 4,
  },
  button: {
    marginTop: 8,
  },
});

export default EmptyState;
