// src/hooks/useWatsonWebSocket.ts - English version
import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export const useWatsonWebSocket = () => {
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Watson configuration and limits
  const WATSON_API_KEY = '4EQfN8ej7oCKt6Xwvl3KK_1kyVVT38lPnhQ5pQnsm8yk';
  const WATSON_BASE_URL = 'api.au-syd.speech-to-text.watson.cloud.ibm.com';
  const WATSON_WS_URL = `wss://${WATSON_BASE_URL}/v1/recognize`;
  
  // Watson limits
  const MAX_RECORDING_TIME = 5 * 60 * 1000; // 5 minutes (Watson recommended max duration)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (Watson file size limit)
  const WARNING_TIME = 4.5 * 60 * 1000; // Warning at 4.5 minutes

  const startRecording = async (): Promise<string | null> => {
    try {
      if (isListening || recording) return null;

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Microphone permission required');
        return null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Optimized recording settings
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000
        }
      });
      
      setRecording(newRecording);
      setIsListening(true);
      setTranscribedText('');
      setRecordingDuration(0);
      
      // Start duration timer - update every second
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1000;
          
          // Warning at 4.5 minutes
          if (newDuration >= WARNING_TIME && newDuration < WARNING_TIME + 1000) {
            Alert.alert(
              'Recording Time Warning', 
              'Approaching 5 minute limit, recording will auto-stop and upload',
              [{ text: 'OK' }]
            );
          }
          
          return newDuration;
        });
      }, 1000);
      
      // Watson max duration limit - auto stop after 5 minutes
      timeoutRef.current = setTimeout(async () => {
        console.log('Reached Watson max recording duration limit, auto-stopping and uploading...');
        Alert.alert(
          'Auto Stop', 
          'Reached 5 minute limit, uploading recording for recognition...',
          [{ text: 'OK' }]
        );
        await stopRecording();
      }, MAX_RECORDING_TIME);
      
      return `Recording started (Max: ${MAX_RECORDING_TIME / 60000} minutes)...`;
    } catch (err) {
      console.error('Recording failed:', err);
      setIsListening(false);
      setRecording(null);
      setRecordingDuration(0);
      return null;
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      setIsListening(false);
      return;
    }

    try {
      setIsProcessing(true);
      
      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      const finalDuration = recordingDuration;
      console.log(`Stopping recording after ${Math.round(finalDuration / 1000)}s for Watson WebSocket...`);
      
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      setRecording(null);
      setIsListening(false);
      
      if (uri) {
        // Check file size
        const response = await fetch(uri);
        const audioBlob = await response.blob();
        const fileSize = audioBlob.size;
        
        console.log(`Audio file: ${Math.round(fileSize / 1024)}KB, Duration: ${Math.round(finalDuration / 1000)}s`);
        
        // Check if exceeds Watson limits
        if (fileSize > MAX_FILE_SIZE) {
          const errorMsg = `File too large: ${Math.round(fileSize / 1024 / 1024)}MB (Max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
          console.error(errorMsg);
          setTranscribedText(`Recording file too large

File size: ${Math.round(fileSize / 1024 / 1024)}MB
Watson limit: ${MAX_FILE_SIZE / 1024 / 1024}MB

Suggestions:
- Shorten recording time
- Lower audio quality settings
- Record in segments`);
          return;
        }
        
        // Auto upload to Watson
        console.log('Auto-uploading to Watson for recognition...');
        const result = await processAudioWithWebSocket(uri);
        setTranscribedText(result);
      } else {
        setTranscribedText('No audio file generated');
      }
      
    } catch (error) {
      console.error('Recording error:', error);
      setRecording(null);
      setIsListening(false);
      setTranscribedText(`Recording error: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setRecordingDuration(0);
    }
  };

  // Get IAM access token
  const getWatsonToken = async (): Promise<string> => {
    try {
      console.log('Getting Watson IAM token...');
      
      const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WATSON_API_KEY}`
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Got Watson IAM token');
      return data.access_token;
    } catch (error) {
      console.error('Failed to get Watson token:', error);
      throw error;
    }
  };

  // Process audio with WebSocket implementation
  const processAudioWithWebSocket = async (audioUri: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Starting Watson WebSocket process...');
        
        // Step 1: Get access token
        const accessToken = await getWatsonToken();
        
        // Step 2: Establish WebSocket connection - pass token in URL
        console.log('Connecting to Watson WebSocket with token...');
        const wsUrl = `${WATSON_WS_URL}?access_token=${accessToken}`;
        console.log('WebSocket URL:', wsUrl.substring(0, 80) + '...');
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        let hasResult = false;
        let connectionOpened = false;
        
        ws.onopen = async () => {
          console.log('WebSocket connected to Watson');
          connectionOpened = true;
          
          try {
            // Send start message
            const startMessage = {
              action: 'start',
              'content-type': 'audio/wav',
              'continuous': false,
              'interim_results': false,
              'word_confidence': true,
              'model': 'en-US_BroadbandModel'
            };
            
            console.log('Sending start message:', startMessage);
            ws.send(JSON.stringify(startMessage));
            
            // Wait for server response
            setTimeout(async () => {
              try {
                // Send audio data - React Native compatible version
                console.log('Preparing to send audio data...');
                
                // Method 1: Try direct file reading
                let audioData;
                try {
                  // In React Native, directly read file URI
                  const response = await fetch(audioUri);
                  
                  // Try multiple ways to get audio data
                  if (response.arrayBuffer) {
                    // Method 1: If arrayBuffer is supported
                    audioData = await response.arrayBuffer();
                    console.log(`Audio data (arrayBuffer): ${Math.round(audioData.byteLength / 1024)}KB`);
                  } else {
                    // Method 2: Use blob + FileReader
                    const audioBlob = await response.blob();
                    console.log(`Audio blob size: ${Math.round(audioBlob.size / 1024)}KB`);
                    
                    audioData = await new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        console.log('FileReader completed');
                        resolve(reader.result);
                      };
                      reader.onerror = (error) => {
                        console.log('FileReader failed:', error);
                        reject(error);
                      };
                      reader.readAsArrayBuffer(audioBlob);
                    });
                    
                    console.log(`Audio data (FileReader): ${Math.round(audioData.byteLength / 1024)}KB`);
                  }
                } catch (fetchError) {
                  console.log('Fetch method failed, trying alternative:', fetchError.message);
                  
                  // Method 3: If above fails, try sending blob directly
                  const response = await fetch(audioUri);
                  const audioBlob = await response.blob();
                  audioData = audioBlob; // Send blob directly
                  console.log(`Sending blob directly: ${Math.round(audioBlob.size / 1024)}KB`);
                }
                
                // Send audio data
                console.log('Sending audio data to Watson...');
                ws.send(audioData);
                
                // Send stop message
                setTimeout(() => {
                  const stopMessage = { action: 'stop' };
                  console.log('Sending stop message');
                  ws.send(JSON.stringify(stopMessage));
                }, 2000);
                
              } catch (audioError) {
                console.error('Error sending audio:', audioError);
                reject(new Error(`Audio send failed: ${audioError.message}`));
              }
            }, 1500);
            
          } catch (setupError) {
            console.error('Setup error:', setupError);
            reject(setupError);
          }
        };

        ws.onmessage = (event) => {
          try {
            console.log('Raw message:', event.data);
            
            // Process JSON message
            const response = JSON.parse(event.data);
            console.log('Parsed response:', response);
            
            // Check status
            if (response.state) {
              console.log('Watson state:', response.state);
              return;
            }
            
            // Process recognition results
            if (response.results && response.results.length > 0) {
              const result = response.results[0];
              console.log('Got result:', result);
              
              if (result.final && result.alternatives && result.alternatives.length > 0) {
                const transcript = result.alternatives[0].transcript.trim();
                const confidence = Math.round((result.alternatives[0].confidence || 0) * 100);
                
                if (transcript) {
                  hasResult = true;
                  ws.close();
                  resolve(`"${transcript}"

Watson WebSocket STT Success!
Confidence: ${confidence}%
Time: ${new Date().toLocaleTimeString()}
Server: Australia (WebSocket)
Method: IAM Token + WebSocket

Watson WebSocket Working!`);
                  return;
                }
              }
            }
            
            // Check for errors
            if (response.error) {
              console.error('Watson error:', response.error);
              reject(new Error(`Watson error: ${response.error}`));
            }
            
          } catch (parseError) {
            console.error('Parse error:', parseError);
            console.log('Raw data:', event.data);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          
          if (!connectionOpened) {
            reject(new Error('WebSocket connection refused - likely network or authentication issue'));
          } else {
            reject(new Error('WebSocket communication error'));
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          
          if (!hasResult) {
            if (event.code === 1006) {
              reject(new Error('WebSocket connection lost - network issue'));
            } else if (event.code === 1002) {
              reject(new Error('WebSocket protocol error'));
            } else {
              reject(new Error(`WebSocket closed: ${event.code} - ${event.reason || 'Unknown'}`));
            }
          }
        };

        // 60 second timeout
        setTimeout(() => {
          if (!hasResult && ws.readyState !== WebSocket.CLOSED) {
            console.log('WebSocket timeout');
            ws.close();
            reject(new Error('WebSocket timeout - no response in 60s'));
          }
        }, 60000);

      } catch (error) {
        console.error('WebSocket setup error:', error);
        reject(error);
      }
    });
  };

  // Improved connection test
  const testWebSocketConnection = async (): Promise<string> => {
    try {
      console.log('Testing Watson WebSocket connection...');
      
      // Step 1: Test token acquisition
      console.log('Step 1: Testing token acquisition...');
      const accessToken = await getWatsonToken();
      
      if (!accessToken) {
        return 'Step 1 Failed: Could not get Watson access token';
      }
      
      console.log('Step 1 Success: Token acquired');
      
      // Step 2: Test WebSocket connection
      console.log('Step 2: Testing WebSocket connection...');
      
      return new Promise((resolve) => {
        const wsUrl = `${WATSON_WS_URL}?access_token=${accessToken}`;
        console.log('Testing URL:', wsUrl.substring(0, 80) + '...');
        
        const testWs = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
          testWs.close();
          resolve(`Step 2 Failed: WebSocket CONNECTION TIMEOUT

Token: Success
WebSocket: Timeout (20s)

This means:
- Token acquisition works
- WebSocket connection is blocked
- Network specifically blocks WebSocket traffic to Watson

Solutions:
- Try mobile data instead of WiFi
- WebSocket traffic may be blocked by firewall`);
        }, 20000);

        testWs.onopen = () => {
          console.log('WebSocket opened successfully');
          clearTimeout(timeout);
          testWs.close();
          resolve(`Watson WebSocket Test: COMPLETE SUCCESS

Step 1 - Token: Success
Step 2 - WebSocket: Success
Server: ${WATSON_BASE_URL}
Protocol: WSS + IAM Token

Ready for speech recognition!`);
        };

        testWs.onerror = (error) => {
          console.log('WebSocket connection error:', error);
          clearTimeout(timeout);
          resolve(`Step 2 Failed: WebSocket CONNECTION ERROR

Token: Success  
WebSocket: Connection refused

Analysis:
- Authentication works (token obtained)
- WebSocket connection blocked by network
- This is a network-level restriction

Next steps:
- Switch to mobile data
- Try different network
- Contact network administrator`);
        };

        testWs.onclose = (event) => {
          if (event.code !== 1000 && event.code !== 1005) {
            resolve(`Step 2 Failed: WebSocket UNEXPECTED CLOSE

Close Code: ${event.code}
Reason: ${event.reason || 'No reason provided'}

Common codes:
- 1006: Network connection lost
- 1002: Protocol error
- 1011: Server error`);
          }
        };
      });

    } catch (tokenError) {
      console.log('Token error:', tokenError);
      return `Step 1 Failed: TOKEN ACQUISITION ERROR

Error: ${tokenError.message}

Possible causes:
- Invalid API key
- Network blocks IBM Cloud token service
- API key expired or revoked
- Service quota exceeded

Check:
- API key in IBM Cloud console
- Service status and billing
- Try mobile data for token request`;
    }
  };

  const clearTranscription = () => {
    setTranscribedText('');
    setRecordingDuration(0);
  };

  // Format recording duration display
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return { 
    startRecording, 
    stopRecording,
    isListening, 
    transcribedText,
    isProcessing,
    clearTranscription,
    testWebSocketConnection,
    recordingDuration,
    formatDuration,
    maxRecordingTime: MAX_RECORDING_TIME,
  };
};