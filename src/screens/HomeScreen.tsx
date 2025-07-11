import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import VoiceButton from '../components/voice/VoiceButton';
import WeatherCard from '../components/weather/WeatherCard';
import { useWatsonWebSocket } from '../hooks/useWatsonWebSocket';
import { useWeather } from '../hooks/useWeather';
import { useSpeechAIIntegration } from '../hooks/useSpeechAIIntegration.ts';
import VoiceVisualizer from '../components/voice/VoiceVisualizer';

export default function HomeScreen() {
  const { 
    startRecording, 
    stopRecording, 
    isListening, 
    transcribedText, 
    isProcessing, 
    clearTranscription,
    testWebSocketConnection,
    recordingDuration,
    formatDuration,
    maxRecordingTime
  } = useWatsonWebSocket();
  
  const { weather, loading, refreshWeather, toggleLocationMode, useLocation } = useWeather();

  const {
    aiResponse,
    isTyping,
    isProcessingAI,
    aiError,
    isAiConnected,
    sendTextToAIStream,
    sendTextToAI,
    testWatsonAI,
    clearAIResults
  } = useSpeechAIIntegration();

  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [inputText, setInputText] = useState('');


  const handleVoicePress = async () => {
    if (isListening) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleTestConnection = async () => {
    const result = await testWebSocketConnection();
    console.log('WebSocket Test Result:', result);
    
    const isSuccess = result && result.includes('SUCCESS');
    setIsVoiceConnected(isSuccess);
    
    Alert.alert('Watson WebSocket Test', result);
  };


  const handleTestAiConnection = async () => {
    try {
      const result = await testWatsonAI();
      Alert.alert('Watson AI Connection Test', result);
    } catch (error) {
      Alert.alert('Watson AI Connection Test', 'FAILED - ' + error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) {
      Alert.alert('Notice', 'Please enter a message');
      return;
    }

    try {
      await sendTextToAIStream(inputText);
      setInputText('');
    } catch (error) {
      Alert.alert('Error', 'AI response failed: ' + error.message);
    }
  };

  const handleClearChat = () => {
    setInputText('');
    clearAIResults();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI Weather Art</Text>
        <Text style={styles.subtitle}>Powered by Watsonx WebSocket</Text>
        
        <WeatherCard 
          weather={weather}
          loading={loading}
          onRefresh={refreshWeather}
          onToggleLocation={toggleLocationMode}
          useLocation={useLocation}
        />
        
        {/* AI Chat Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Chat Assistant</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isAiConnected ? '#28a745' : '#dc3545' }]} />
            <Text style={styles.statusText}>
              AI Status: {isAiConnected ? 'Connected' : 'Disconnected'}
            </Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleTestAiConnection}
              disabled={isProcessingAI}
            >
              {isProcessingAI ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Test</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.responseSection}>
            <Text style={styles.responseLabel}>
              AI Response: {isTyping ? 'Typing...' : 'Ready'}
            </Text>
            <View style={styles.responseBox}>
              {isProcessingAI ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007bff" />
                  <Text style={styles.loadingText}>AI is thinking...</Text>
                </View>
              ) : aiError ? (
                <Text style={styles.errorText}>Error: {aiError}</Text>
              ) : aiResponse ? (
                <Text style={styles.responseText}>
                  {aiResponse}
                  {isTyping && <Text style={styles.cursor}>|</Text>}
                </Text>
              ) : (
                <Text style={styles.placeholderText}>Waiting for AI response...</Text>
              )}
            </View>
          </View>

          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Enter message for AI..."
              multiline
              maxLength={500}
              editable={!isProcessingAI}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.clearButton]}
                onPress={handleClearChat}
              >
                <Text style={styles.buttonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.sendButton,
                  { opacity: inputText.trim() ? 1 : 0.5 }
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isProcessingAI || isTyping}
              >
                {isProcessingAI ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Voice Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Assistant</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isVoiceConnected ? '#28a745' : '#dc3545' }]} />
            <Text style={styles.statusText}>
              Voice Status: {isVoiceConnected ? 'Connected' : 'Disconnected'}
            </Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleTestConnection}
              disabled={isListening || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Test</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.responseSection}>
            <Text style={styles.responseLabel}>Voice Transcription:</Text>
            <View style={styles.responseBox}>
              {isProcessing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007bff" />
                  <Text style={styles.loadingText}>Processing your voice...</Text>
                </View>
              ) : transcribedText ? (
                <Text style={styles.responseText}>{transcribedText}</Text>
              ) : (
                <Text style={styles.placeholderText}>Waiting for voice input...</Text>
              )}
            </View>
          </View>
          
          <Text style={styles.statusMessage}>
            {isListening 
              ? `Recording... ${formatDuration(recordingDuration)} / ${formatDuration(maxRecordingTime)}` 
              : isProcessing
              ? 'Processing your voice via WebSocket...'
              : 'Ready to record (Max: 5 minutes)'
            }
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.clearButton]}
              onPress={clearTranscription}
              disabled={!transcribedText}
            >
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.button,
                { 
                  backgroundColor: isListening ? '#dc3545' : '#28a745',
                  opacity: 1 
                }
              ]}
              onPress={handleVoicePress}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isListening ? 'Stop Recording' : 'Start Recording'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <VoiceVisualizer 
            isRecording={isListening}
            transcribedText={transcribedText}
            isProcessing={isProcessing}
            onClear={clearTranscription}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  section: {
    width: '100%',
    marginVertical: 15,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  responseSection: {
    marginBottom: 15,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  responseBox: {
    minHeight: 80,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#007bff',
    fontStyle: 'italic',
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  cursor: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    lineHeight: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  inputSection: {
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  clearButton: {
    backgroundColor: '#6c757d',
    flex: 0.3,
  },
  sendButton: {
    backgroundColor: '#28a745',
    flex: 0.6,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '400',
    marginVertical: 15,
  },
});