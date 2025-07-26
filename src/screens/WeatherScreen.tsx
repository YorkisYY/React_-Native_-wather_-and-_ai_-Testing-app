// src/screens/WeatherScreen.tsx - AR功能组件（被HomeScreen引用）
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal
} from 'react-native';
import ExpoCameraAR from '../components/ar/ExpoCameraAR';
import { usePet } from '../hooks/usePet';

export default function WeatherScreen() {
  // 寵物狀態管理
  const {
    petStatus,
    setPetState,
    isListening: petIsListening,
    isThinking: petIsThinking,
    isSpeaking: petIsSpeaking,
  } = usePet();

  // AR 狀態
  const [isARMode, setIsARMode] = useState(false);
  const [arDebugInfo, setArDebugInfo] = useState('AR not started');

  const handleStartAR = () => {
    setIsARMode(true);
    setArDebugInfo('AR Mode Started');
  };

  const handleARDebugInfo = (info: string) => {
    setArDebugInfo(info);
  };

  const handleExitAR = () => {
    setIsARMode(false);
    setArDebugInfo('AR Mode Exited');
    setPetState('idle');
  };

  // 渲染 AR 組件
  const renderARComponent = () => {
    return (
      <ExpoCameraAR
        isListening={petIsListening}
        isSpeaking={petIsSpeaking}
        isThinking={petIsThinking}
        petStatus={petStatus}
        onExit={handleExitAR}
        onDebugInfo={handleARDebugInfo}
      />
    );
  };

  return (
    <>
      {/* AR Section */}
      <View style={styles.arSection}>
        <Text style={styles.sectionTitle}>AR Pet Experience</Text>
        
        <TouchableOpacity 
          style={[styles.arButton, { opacity: isARMode ? 0.7 : 1 }]}
          onPress={handleStartAR}
          disabled={isARMode}
        >
          <Text style={styles.arButtonText}>
            {isARMode ? 'AR Running...' : 'Launch 2D AR Pet'}
          </Text>
        </TouchableOpacity>
        
        {isARMode && (
          <TouchableOpacity 
            style={styles.arStopButton}
            onPress={handleExitAR}
          >
            <Text style={styles.arStopButtonText}>Exit AR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* AR 全屏模態 */}
      <Modal 
        visible={isARMode} 
        animationType="fade" 
        presentationStyle="fullScreen"
        onRequestClose={handleExitAR}
      >
        {renderARComponent()}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  arSection: {
    width: '100%',
    marginVertical: 15,
    padding: 25,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#007bff',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  arButton: {
    backgroundColor: '#007bff',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 15,
  },
  arButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  arStopButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  arStopButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});