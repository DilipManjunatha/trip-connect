import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { Expense, RootStackParamList } from '../../types';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ExpensesScreenRouteProp = RouteProp<RootStackParamList, 'Expenses'>;

const ExpensesScreen: React.FC = () => {
  const route = useRoute<ExpensesScreenRouteProp>();
  const { groupId } = route.params;

  const { data: expenses, isLoading, refetch } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => apiService.getExpenses(groupId),
  });

  const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  const renderExpense = ({ item }: { item: Expense }) => (
    <Card style={styles.expenseCard}>
      <Card.Content>
        <View style={styles.expenseHeader}>
          <Text variant="titleMedium">{item.title}</Text>
          <Text variant="titleMedium" style={styles.amount}>
            ${item.amount.toLocaleString()}
          </Text>
        </View>
        {item.description && (
          <Text variant="bodySmall" style={styles.description}>
            {item.description}
          </Text>
        )}
        <View style={styles.infoRow}>
          <Icon name="tag" size={16} color="#6B7280" />
          <Text variant="bodySmall" style={styles.infoText}>
            {item.category}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="calendar" size={16} color="#6B7280" />
          <Text variant="bodySmall" style={styles.infoText}>
            {format(new Date(item.date), 'MMM dd, yyyy')}
          </Text>
        </View>
        {item.paidBy && (
          <View style={styles.infoRow}>
            <Icon name="account" size={16} color="#6B7280" />
            <Text variant="bodySmall" style={styles.infoText}>
              Paid by: {item.paidBy}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Icon name="share-variant" size={16} color="#6B7280" />
          <Text variant="bodySmall" style={styles.infoText}>
            Split: {item.splitType}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.totalLabel}>
            Total Expenses
          </Text>
          <Text variant="headlineMedium" style={styles.totalAmount}>
            ${totalExpenses.toLocaleString()}
          </Text>
        </Card.Content>
      </Card>

      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No expenses found
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#3B82F6',
  },
  totalLabel: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  totalAmount: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 8,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  expenseCard: {
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amount: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  description: {
    color: '#6B7280',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  infoText: {
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
  },
});

export default ExpensesScreen;
