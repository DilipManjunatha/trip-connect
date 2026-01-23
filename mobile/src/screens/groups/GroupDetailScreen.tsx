import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, Chip, Avatar, List, Portal, Modal, Searchbar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiService } from '../../services/api';
import { RootStackParamList, Contact } from '../../types';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../utils/roles';

type GroupDetailScreenRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;
type GroupDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GroupDetail'>;

const statusColors: Record<string, string> = {
  PLANNING: theme.colors.primary,
  CONFIRMED: '#10B981',
  ONGOING: '#F59E0B',
  COMPLETED: '#6B7280',
  CANCELLED: '#EF4444',
};

const GroupDetailScreen: React.FC = () => {
  const route = useRoute<GroupDetailScreenRouteProp>();
  const navigation = useNavigation<GroupDetailScreenNavigationProp>();
  const { user } = useAuth();
  const { groupId } = route.params;
  const queryClient = useQueryClient();

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => apiService.getGroup(groupId),
  });

  // Only fetch contacts if user is admin (required for add members modal)
  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: apiService.getContacts,
    enabled: isAdmin(user) && showAddMemberModal, // Only fetch when modal is open and user is admin
  });

  const addMembersMutation = useMutation({
    mutationFn: (data: { contactIds?: string[]; userIds?: string[] }) =>
      apiService.addMembersToGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      setShowAddMemberModal(false);
      setSelectedContacts([]);
      setSearchQuery('');
      Alert.alert('Success', 'Members added successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add members');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => apiService.removeMemberFromGroup(groupId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      Alert.alert('Success', 'Member removed successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiService.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.goBack();
    },
  });

  const handleDeleteGroup = () => {
    Alert.alert('Delete Group', 'Are you sure you want to delete this trip group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert('Remove Member', `Remove ${memberName} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMemberMutation.mutate(memberId),
      },
    ]);
  };

  const handleAddMembers = () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Selection', 'Please select at least one contact to add');
      return;
    }
    addMembersMutation.mutate({ contactIds: selectedContacts });
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  // Filter contacts that aren't already members
  const existingContactIds = group?.members?.map((m) => m.contactId).filter(Boolean) || [];
  const availableContacts = allContacts
    .filter((c) => !existingContactIds.includes(c.id))
    .filter(
      (c) =>
        c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (isLoading || !group) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Chip style={[styles.statusChip, { backgroundColor: statusColors[group.status] }]} textStyle={styles.statusText}>
              {group.status}
            </Chip>
          </View>

          {group.description && <Text style={styles.description}>{group.description}</Text>}

          {group.destination && (
            <View style={styles.infoRow}>
              <Icon name="map-marker" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{group.destination}</Text>
            </View>
          )}

          {group.startDate && (
            <View style={styles.infoRow}>
              <Icon name="calendar" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {new Date(group.startDate).toLocaleDateString()}
                {group.endDate && ` - ${new Date(group.endDate).toLocaleDateString()}`}
              </Text>
            </View>
          )}

          {group.budget && (
            <View style={styles.infoRow}>
              <Icon name="currency-usd" size={20} color="#10B981" />
              <Text style={[styles.infoText, { color: '#10B981', fontWeight: '600' }]}>
                ${group.budget.toFixed(2)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Members Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members ({group.members?.length || 0})</Text>
            {isAdmin(user) && (
              <Button mode="contained" onPress={() => setShowAddMemberModal(true)} compact>
                Add Members
              </Button>
            )}
          </View>

          {group.members?.map((member) => {
            const name = member.contact
              ? `${member.contact.firstName} ${member.contact.lastName}`
              : member.user
              ? `${member.user.firstName} ${member.user.lastName}`
              : 'Unknown';
            const initials = name
              .split(' ')
              .map((n) => n[0])
              .join('');

            return (
              <List.Item
                key={member.id}
                title={name}
                description={member.role}
                left={() => <Avatar.Text size={40} label={initials} style={styles.avatar} />}
                right={() => (
                  <View style={styles.memberActions}>
                    {member.isConfirmed && <Icon name="check-circle" size={20} color="#10B981" />}
                    {isAdmin(user) && member.role !== 'ORGANIZER' && (
                      <Button
                        mode="text"
                        textColor="#EF4444"
                        onPress={() => handleRemoveMember(member.id, name)}
                        compact
                      >
                        Remove
                      </Button>
                    )}
                  </View>
                )}
              />
            );
          })}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="message"
          onPress={() => navigation.navigate('Messages', { groupId })}
          style={styles.actionButton}
        >
          Messages
        </Button>
        <Button
          mode="outlined"
          icon="calendar-clock"
          onPress={() => navigation.navigate('Itinerary', { groupId })}
          style={styles.actionButton}
        >
          Itinerary
        </Button>
        <Button
          mode="outlined"
          icon="cash"
          onPress={() => navigation.navigate('Expenses', { groupId })}
          style={styles.actionButton}
        >
          Expenses
        </Button>
        {isAdmin(user) && (
          <>
            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => navigation.navigate('GroupForm', { groupId })}
              style={styles.actionButton}
            >
              Edit Group
            </Button>
            <Button
              mode="outlined"
              icon="delete"
              textColor="#EF4444"
              onPress={handleDeleteGroup}
              style={[styles.actionButton, styles.deleteButton]}
            >
              Delete Group
            </Button>
          </>
        )}
      </View>

      {/* Add Members Modal */}
      <Portal>
        <Modal visible={showAddMemberModal} onDismiss={() => setShowAddMemberModal(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Add Members</Text>

          <Searchbar
            placeholder="Search contacts..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          <ScrollView style={styles.contactList}>
            {availableContacts.length === 0 ? (
              <Text style={styles.emptyText}>No contacts available to add</Text>
            ) : (
              availableContacts.map((contact) => (
                <List.Item
                  key={contact.id}
                  title={`${contact.firstName} ${contact.lastName}`}
                  description={contact.email}
                  left={() => (
                    <Avatar.Text
                      size={40}
                      label={`${contact.firstName[0]}${contact.lastName[0]}`}
                      style={styles.avatar}
                    />
                  )}
                  right={() => (
                    <Button
                      mode={selectedContacts.includes(contact.id) ? 'contained' : 'outlined'}
                      onPress={() => toggleContactSelection(contact.id)}
                      compact
                    >
                      {selectedContacts.includes(contact.id) ? 'Selected' : 'Select'}
                    </Button>
                  )}
                />
              ))
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowAddMemberModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddMembers}
              style={{ flex: 1, marginLeft: 8 }}
              disabled={selectedContacts.length === 0}
              loading={addMembersMutation.isPending}
            >
              Add ({selectedContacts.length})
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
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
  card: {
    margin: 16,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actions: {
    padding: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  searchBar: {
    marginBottom: 16,
  },
  contactList: {
    maxHeight: 400,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
});

export default GroupDetailScreen;
