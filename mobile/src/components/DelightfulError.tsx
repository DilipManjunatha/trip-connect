import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme';

interface DelightfulErrorProps {
  onRetry?: () => void;
  title?: string;
  message?: string;
}

const delightfulMessages = [
  {
    emoji: '🌐',
    title: "Oops! We're taking a coffee break ☕",
    message: "Our servers are having a little siesta. They'll be back in a jiffy!",
  },
  {
    emoji: '🚀',
    title: "Houston, we have a connection issue!",
    message: "Don't worry, even astronauts have connection problems. We're working on it!",
  },
  {
    emoji: '🌙',
    title: "The server is catching some Z's",
    message: "It's probably dreaming about your next amazing trip. Give it a moment!",
  },
  {
    emoji: '🎈',
    title: "Our balloons floated away!",
    message: "We're fetching them back. Your trip plans are safe, promise!",
  },
  {
    emoji: '🐢',
    title: "Slow and steady wins the race!",
    message: "Our servers are moving at turtle speed today. They'll catch up soon!",
  },
  {
    emoji: '🌊',
    title: "Riding the waves!",
    message: "We're surfing through some network turbulence. Hang tight!",
  },
];

const DelightfulError: React.FC<DelightfulErrorProps> = ({ onRetry, title, message }) => {
  const randomMessage = delightfulMessages[Math.floor(Math.random() * delightfulMessages.length)];
  const displayTitle = title || randomMessage.title;
  const displayMessage = message || randomMessage.message;
  const emoji = randomMessage.emoji;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      
      <Text style={styles.title}>{displayTitle}</Text>
      
      <Text style={styles.message}>{displayMessage}</Text>

      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          style={styles.retryButton}
          icon="refresh"
        >
          Try Again
        </Button>
      )}

      <View style={styles.tipContainer}>
        <Icon name="information-outline" size={16} color="#9CA3AF" />
        <Text style={styles.tip}>Check your internet connection</Text>
      </View>

      <Text style={styles.hint}>💡 Tip: Sometimes a quick refresh does the trick!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F0F4FF',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  retryButton: {
    marginBottom: 24,
    backgroundColor: theme.colors.primary,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tip: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default DelightfulError;
