import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardScreen from '../screens/DashboardScreen';
import ContactsScreen from '../screens/contacts/ContactsScreen';
import ContactDetailScreen from '../screens/contacts/ContactDetailScreen';
import ContactFormScreen from '../screens/contacts/ContactFormScreen';
import TagsScreen from '../screens/tags/TagsScreen';
import TagFormScreen from '../screens/tags/TagFormScreen';
import ListsScreen from '../screens/lists/ListsScreen';
import ListDetailScreen from '../screens/lists/ListDetailScreen';
import GroupsScreen from '../screens/groups/GroupsScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import GroupFormScreen from '../screens/groups/GroupFormScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import ItineraryScreen from '../screens/groups/ItineraryScreen';
import ExpensesScreen from '../screens/groups/ExpensesScreen';
import UsersScreen from '../screens/users/UsersScreen';
import UserDetailScreen from '../screens/users/UserDetailScreen';
import { RootStackParamList } from '../types';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roles';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ title: 'Dashboard' }}
    />
  </Stack.Navigator>
);

const ContactsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Contacts"
      component={ContactsScreen}
      options={{ title: 'Contacts' }}
    />
    <Stack.Screen
      name="ContactDetail"
      component={ContactDetailScreen}
      options={{ title: 'Contact Details' }}
    />
    <Stack.Screen
      name="ContactForm"
      component={ContactFormScreen}
      options={{ title: 'Contact' }}
    />
  </Stack.Navigator>
);

const GroupsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Groups"
      component={GroupsScreen}
      options={{ title: 'Trips' }}
    />
    <Stack.Screen
      name="GroupDetail"
      component={GroupDetailScreen}
      options={{ title: 'Group Details' }}
    />
    <Stack.Screen
      name="GroupForm"
      component={GroupFormScreen}
      options={{ title: 'Trip' }}
    />
    <Stack.Screen
      name="Messages"
      component={MessagesScreen}
      options={{ title: 'Messages' }}
    />
    <Stack.Screen
      name="Itinerary"
      component={ItineraryScreen}
      options={{ title: 'Itinerary' }}
    />
    <Stack.Screen
      name="Expenses"
      component={ExpensesScreen}
      options={{ title: 'Expenses' }}
    />
  </Stack.Navigator>
);

const ListsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Lists"
      component={ListsScreen}
      options={{ title: 'Smart Lists' }}
    />
    <Stack.Screen
      name="ListDetail"
      component={ListDetailScreen}
      options={{ title: 'List Details' }}
    />
  </Stack.Navigator>
);

const TagsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Tags"
      component={TagsScreen}
      options={{ title: 'Tags' }}
    />
    <Stack.Screen
      name="TagForm"
      component={TagFormScreen}
      options={{ title: 'Tag' }}
    />
  </Stack.Navigator>
);

const UsersStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Users"
      component={UsersScreen}
      options={{ title: 'Users' }}
    />
    <Stack.Screen
      name="UserDetail"
      component={UserDetailScreen}
      options={{ title: 'User Details' }}
    />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  const { user } = useAuth();
  const adminOnly = isAdmin(user);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      {adminOnly && (
        <Tab.Screen
          name="ContactsTab"
          component={ContactsStack}
          options={{
            title: 'Contacts',
            tabBarIcon: ({ color, size }) => (
              <Icon name="account-group" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="GroupsTab"
        component={GroupsStack}
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => (
            <Icon name="airplane" size={size} color={color} />
          ),
        }}
      />
      {adminOnly && (
        <>
          <Tab.Screen
            name="ListsTab"
            component={ListsStack}
            options={{
              title: 'Smart Lists',
              tabBarIcon: ({ color, size }) => (
                <Icon name="format-list-bulleted" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="TagsTab"
            component={TagsStack}
            options={{
              title: 'Tags',
              tabBarIcon: ({ color, size }) => (
                <Icon name="tag" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="UsersTab"
            component={UsersStack}
            options={{
              title: 'Users',
              tabBarIcon: ({ color, size }) => (
                <Icon name="account-cog" size={size} color={color} />
              ),
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default MainNavigator;
