import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Modal, View } from 'react-native';
import { Text, IconButton } from 'react-native-paper';

interface InfoTooltipProps {
  content: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <IconButton
          icon="information-outline"
          size={20}
          iconColor="#9CA3AF"
          style={styles.icon}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.tooltip}>
            <Text variant="bodyMedium" style={styles.text}>
              {content}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  icon: {
    margin: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltip: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    maxWidth: 280,
  },
  text: {
    color: '#FFFFFF',
  },
});

export default InfoTooltip;
