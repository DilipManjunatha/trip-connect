import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  const handleRegister = async () => {
    if (!formData.email || !formData.username || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all fields');
      setShowError(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setShowError(true);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            Create Account
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign up to get started
          </Text>

          <TextInput
            label="First Name"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Last Name"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Username"
            value={formData.username}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
            mode="outlined"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="account-circle" />}
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
          />

          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock-check" />}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            Already have an account? Sign In
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={3000}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#6B7280',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  linkButton: {
    marginTop: 16,
  },
});

export default RegisterScreen;
