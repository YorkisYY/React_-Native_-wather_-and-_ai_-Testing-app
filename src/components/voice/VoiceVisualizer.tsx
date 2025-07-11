// src/components/voice/VoiceVisualizer.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface VoiceVisualizerProps {
  isRecording: boolean;
  transcribedText: string;
  isProcessing: boolean;
  onClear: () => void;
}

export default function VoiceVisualizer({ 
  isRecording, 
  transcribedText, 
  isProcessing, 
  onClear 
}: VoiceVisualizerProps) {
  const animatedValues = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.1))
  ).current;

  useEffect(() => {
    if (isRecording) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [isRecording]);

  const startAnimation = () => {
    const animations = animatedValues.map((animatedValue) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: Math.random() * 0.9 + 0.1,
            duration: 150 + Math.random() * 300,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: Math.random() * 0.9 + 0.1,
            duration: 150 + Math.random() * 300,
            useNativeDriver: false,
          }),
        ])
      );
    });

    Animated.stagger(50, animations).start();
  };

  const stopAnimation = () => {
    animatedValues.forEach((animatedValue) => {
      animatedValue.stopAnimation();
      Animated.timing(animatedValue, {
        toValue: 0.1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing audio...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isRecording ? (

        <View style={styles.visualizer}>
          {animatedValues.map((animatedValue, index) => (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  height: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 60],
                  }),
                  backgroundColor: '#FF3B30',
                },
              ]}
            />
          ))}
        </View>
      ) : (

        <View style={styles.defaultState}>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    marginVertical: 20,
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    width: Dimensions.get('window').width * 0.8,
    justifyContent: 'space-between',
  },
  bar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
  defaultState: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  hintText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    fontStyle: 'italic',
  },
  processingContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 200,
  },
  processingText: {
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic',
  },
});