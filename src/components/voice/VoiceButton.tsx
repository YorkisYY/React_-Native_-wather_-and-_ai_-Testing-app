// src/components/voice/VoiceButton.tsx 
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface VoiceButtonProps {
  onPress: () => void;
  isListening: boolean;
  style?: ViewStyle;
}

export default function VoiceButton({ onPress, isListening, style }: VoiceButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, isListening && styles.listening, style]} 
      onPress={onPress}
    >
      <Text style={styles.buttonText}>
        {isListening ? 'Stop Recording' : 'Start Recording'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  listening: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});