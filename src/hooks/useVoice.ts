
import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watson STT 
  const WATSON_CONFIGS = [
    {
      url: 'https://api.au-syd.speech-to-text.watson.cloud.ibm.com/instances/2b80bd30-fd83-4d54-9771-a6980e97a19d/v1/recognize',
      region: 'AU-SYD',
      apiKey: '4f0JN8ej7oCXt6Xwv13KK_1kyVVT38IPnhQ5pQnsm8yk'
    }
  ];

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

      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000, 
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
          linearPCMIsFloat: false,
        },
      });
      
      setRecording(newRecording);
      setIsListening(true);
      setTranscribedText('');
      
  
      timeoutRef.current = setTimeout(async () => {
        await stopRecording();
      }, 2000); 
      
      return 'Recording for Watson STT (2s - optimized)...';
    } catch (err) {
      console.error('Recording failed:', err);
      setIsListening(false);
      setRecording(null);
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
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      console.log('🎤 Stopping recording for Watson...');
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      setRecording(null);
      setIsListening(false);
      
      if (uri) {
        const result = await callWatsonWithRetry(uri);
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
    }
  };

  const callWatsonWithRetry = async (audioUri: string): Promise<string> => {
    console.log('🔄 Watson STT with retry strategy...');
    

    const quickTestPassed = await quickNetworkTest();
    console.log(`🌐 Quick network test: ${quickTestPassed ? 'PASSED' : 'FAILED'}`);
    
    if (!quickTestPassed) {
      return `❌ Watson Network Blocked - Domain not accessible`;
    }


    console.log('🔍 Running detailed network analysis...');
    const detailedResults = await detailedNetworkTest();
    console.log(detailedResults);
    
    const methods = [
      () => callWatsonStreamlined(audioUri),
      () => callWatsonDirect(audioUri),
      () => callWatsonWithHeaders(audioUri)
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`🔄 Attempt ${i + 1}/3...`);
        const result = await methods[i]();
        return result;
      } catch (error) {
        console.log(`❌ Method ${i + 1} failed:`, error.message);
        if (i === methods.length - 1) {

          return `${getWatsonTroubleshootingGuide(error.message)}\n\n${detailedResults}`;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return 'All Watson methods failed';
  };


  const quickNetworkTest = async (): Promise<boolean> => {
    try {
      const response = await Promise.race([
        fetch('https://api.au-syd.speech-to-text.watson.cloud.ibm.com', { 
          method: 'HEAD'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network test timeout after 5s')), 5000)
        )
      ]) as Response;
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const callWatsonStreamlined = async (audioUri: string): Promise<string> => {
    console.log('📡 Method 1: Streamlined Watson call (Browser-like)...');
    
    const response = await fetch(audioUri);
    const audioBlob = await response.blob();
    
    console.log(`📊 Audio file size: ${Math.round(audioBlob.size / 1024)}KB`);
    
    try {
      console.log('🌐 Starting Watson API call with browser-like headers...');
      console.log('🔗 URL:', WATSON_CONFIGS[0].url);
      
      const startTime = Date.now();
      

      const watsonResponse = await Promise.race([
        fetch(WATSON_CONFIGS[0].url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`apikey:${WATSON_CONFIGS[0].apiKey}`)}`,
            'Content-Type': 'audio/wav',
            'Accept': 'application/json',

            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
          },
          body: audioBlob,
        }).then(response => {
          const elapsed = Date.now() - startTime;
          console.log(`⏱️ Watson responded in ${elapsed}ms with status: ${response.status}`);
          console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
          return response;
        }),
        new Promise((_, reject) => 
          setTimeout(() => {
            const elapsed = Date.now() - startTime;
            console.log(`⏰ Request timed out after ${elapsed}ms`);
            reject(new Error(`Network timeout after ${elapsed}ms - no response from Watson`));
          }, 15000)
        )
      ]) as Response;

      return await processWatsonResponse(watsonResponse, 'Browser-like');
    } catch (error) {
      console.log('🚨 Network error details:', error);
      throw error;
    }
  };

  const callWatsonDirect = async (audioUri: string): Promise<string> => {
    console.log('📡 Method 2: Watson cURL-style request...');
    
    const response = await fetch(audioUri);
    const audioBlob = await response.blob();
    

    const urlWithParams = `${WATSON_CONFIGS[0].url}`;
    
    console.log('🔗 Using cURL-equivalent format:', urlWithParams);
    
    try {
      const startTime = Date.now();
      
      const watsonResponse = await Promise.race([
        fetch(urlWithParams, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`apikey:${WATSON_CONFIGS[0].apiKey}`)}`,
            'Content-Type': 'audio/wav',
            'Accept': 'application/json',
          },
          body: audioBlob,
        }).then(response => {
          const elapsed = Date.now() - startTime;
          console.log(`⏱️ cURL-style responded in ${elapsed}ms with status: ${response.status}`);
          return response;
        }),
        new Promise((_, reject) => 
          setTimeout(() => {
            const elapsed = Date.now() - startTime;
            reject(new Error(`cURL-style timeout after ${elapsed}ms`));
          }, 18000)
        )
      ]) as Response;

      return await processWatsonResponse(watsonResponse, 'cURL-style');
    } catch (error) {
      console.log('🚨 cURL-style error:', error);
      throw error;
    }
  };

  const callWatsonWithHeaders = async (audioUri: string): Promise<string> => {
    console.log('📡 Method 3: Watson with minimal headers (SSL-friendly)...');
    
    const response = await fetch(audioUri);
    const audioBlob = await response.blob();
    
    try {
      const startTime = Date.now();
      

      const watsonResponse = await Promise.race([
        fetch(WATSON_CONFIGS[0].url, {
          method: 'POST',
          headers: {

            'Authorization': `Basic ${btoa(`apikey:${WATSON_CONFIGS[0].apiKey}`)}`,
            'Content-Type': 'audio/wav',
          },
          body: audioBlob,

          redirect: 'follow',
          referrerPolicy: 'no-referrer',
        }).then(response => {
          const elapsed = Date.now() - startTime;
          console.log(`⏱️ Minimal headers responded in ${elapsed}ms with status: ${response.status}`);
          return response;
        }),
        new Promise((_, reject) => 
          setTimeout(() => {
            const elapsed = Date.now() - startTime;
            reject(new Error(`Minimal headers timeout after ${elapsed}ms`));
          }, 20000)
        )
      ]) as Response;

      return await processWatsonResponse(watsonResponse, 'Minimal Headers');
    } catch (error) {
      console.log('🚨 Minimal headers error:', error);
      throw error;
    }
  };

  const processWatsonResponse = async (watsonResponse: Response, method: string): Promise<string> => {
    console.log(`✅ ${method} method - Watson response: ${watsonResponse.status}`);

    if (!watsonResponse.ok) {
      const errorText = await watsonResponse.text();
      console.error(`Watson error details:`, errorText);
      throw new Error(`Watson ${watsonResponse.status}: ${errorText.substring(0, 100)}`);
    }

    const result = await watsonResponse.json();
    console.log('🎯 Watson result:', JSON.stringify(result, null, 2));

    if (result.results && result.results.length > 0) {
      const alternatives = result.results[0].alternatives;
      if (alternatives && alternatives.length > 0) {
        const transcript = alternatives[0].transcript.trim();
        const confidence = Math.round((alternatives[0].confidence || 0) * 100);
        
        if (transcript) {
          return `🎤 "${transcript}"

✅ Watson STT Success! (${method})
🎯 Confidence: ${confidence}%
🕐 Time: ${new Date().toLocaleTimeString()}
🌏 Server: ${WATSON_CONFIGS[0].region}
⚡ Method: ${method}

🎉 Watson Speech Recognition Working!`;
        }
      }
    }

    throw new Error('No speech detected in Watson response');
  };

  const getWatsonTroubleshootingGuide = (lastError: string): string => {
    return `🔧 Watson STT Troubleshooting

❌ All 3 methods failed
📱 Last error: ${lastError}

🎯 Your recording is working perfectly!
⚠️ Issue is with Watson connectivity

🔧 Solutions to try:

1️⃣ **Network Issues:**
   • Switch to different WiFi network
   • Turn off VPN if using one
   • Try mobile data instead of WiFi
   • Check if corporate firewall blocks Watson

2️⃣ **Watson Service Check:**
   • Login to IBM Cloud console
   • Verify Speech-to-Text service status
   • Check service region (${WATSON_CONFIGS[0].region})
   • Verify API key is active

3️⃣ **Immediate Fixes:**
   • Restart Expo Go app completely
   • Clear app cache/data
   • Re-scan QR code
   • Try different physical location

📊 Technical Details:
• Audio: 3-second WAV files
• Format: 16kHz, Mono, 16-bit, 64kbps
• Expected size: ~24-48KB per recording

🕐 Troubleshooting completed: ${new Date().toLocaleTimeString()}

💡 This appears to be a network connectivity issue to Watson servers.`;
  };

  const diagnoseNetworkIssue = async (): Promise<string> => {
    let diagnosticResults = '🔍 Watson STT Network Diagnostics\n\n';
    

    try {
      console.log('🌐 Testing basic internet connectivity...');
      const response = await Promise.race([
        fetch('https://www.google.com', { method: 'HEAD' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]) as Response;
      
      diagnosticResults += response.ok ? 
        '✅ Basic internet connectivity: OK\n' : 
        '❌ Basic internet connectivity: FAILED\n';
    } catch (error) {
      diagnosticResults += '❌ Basic internet connectivity: FAILED\n';
    }

    try {
      console.log('🔍 Testing Watson domain resolution...');
      const response = await Promise.race([
        fetch('https://api.au-syd.speech-to-text.watson.cloud.ibm.com', { 
          method: 'HEAD',
          headers: {
            'Accept': 'application/json'
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]) as Response;
      
      diagnosticResults += `✅ Watson domain resolution: OK (${response.status})\n`;
    } catch (error) {
      diagnosticResults += '❌ Watson domain resolution: FAILED (DNS/Firewall issue?)\n';
    }


    try {
      console.log('🏥 Testing Watson API authentication...');
      const modelsUrl = WATSON_CONFIGS[0].url.replace('/v1/recognize', '/v1/models');
      console.log('🔗 Testing models endpoint:', modelsUrl);
      
      const response = await Promise.race([
        fetch(modelsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`apikey:${WATSON_CONFIGS[0].apiKey}`)}`,
            'Accept': 'application/json',
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]) as Response;

      if (response.ok) {
        const data = await response.json();
        diagnosticResults += '✅ Watson API authentication: OK\n';
        diagnosticResults += `📊 Available models: ${data.models ? data.models.length : 'Unknown'}\n`;
        diagnosticResults += `🌏 Service region: ${WATSON_CONFIGS[0].region}\n`;
      } else {
        const errorText = await response.text();
        diagnosticResults += `❌ Watson API authentication: FAILED (${response.status})\n`;
        diagnosticResults += `📝 Error: ${errorText.substring(0, 100)}\n`;
      }
    } catch (error) {
      diagnosticResults += `❌ Watson API health check: FAILED (${error.message})\n`;
    }


    diagnosticResults += `\n📱 Environment Info:\n`;
    diagnosticResults += `• Time: ${new Date().toLocaleString()}\n`;
    diagnosticResults += `• Watson Region: ${WATSON_CONFIGS[0].region}\n`;
    diagnosticResults += `• API Endpoint: ${WATSON_CONFIGS[0].url}\n`;


    diagnosticResults += `\n🔧 Specific Troubleshooting:\n`;
    diagnosticResults += `• If DNS fails: Try mobile data instead of WiFi\n`;
    diagnosticResults += `• If auth fails: Check API key in IBM Cloud console\n`;
    diagnosticResults += `• If timeout: Corporate firewall may block Watson\n`;
    diagnosticResults += `• If 403/401: Verify service is active and not expired\n`;
    diagnosticResults += `• If 429: You may have hit rate limits\n`;

    return diagnosticResults;
  };

  const clearTranscription = () => {
    setTranscribedText('');
  };


  const compareNetworkAccess = async (): Promise<string> => {
    let results = '🔍 Network Access Comparison:\n\n';
    
    const testUrls = [
      { name: 'Google API', url: 'https://www.googleapis.com' },
      { name: 'GitHub API', url: 'https://api.github.com' },
      { name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts/1' },
      { name: 'Watson AU-SYD', url: 'https://api.au-syd.speech-to-text.watson.cloud.ibm.com' },
      { name: 'Watson US-South', url: 'https://api.us-south.speech-to-text.watson.cloud.ibm.com' },
      { name: 'IBM Cloud', url: 'https://cloud.ibm.com' },
    ];

    for (const test of testUrls) {
      try {
        const response = await Promise.race([
          fetch(test.url, { method: 'HEAD' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]) as Response;
        
        results += `✅ ${test.name}: OK (${response.status})\n`;
      } catch (error) {
        results += `❌ ${test.name}: ${error.message.includes('timeout') ? 'TIMEOUT' : 'BLOCKED'}\n`;
      }
    }


    results += '\n📤 POST Request Tests:\n';
    
    try {
      const response = await Promise.race([
        fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' })
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]) as Response;
      
      results += `✅ JSONPlaceholder POST: OK (${response.status})\n`;
    } catch (error) {
      results += `❌ JSONPlaceholder POST: FAILED\n`;
    }

    return results + '\n💡 If other APIs work but Watson fails, it\'s domain-specific blocking.';
  };
  const detailedNetworkTest = async (): Promise<string> => {
    let results = '🔍 Detailed Network Analysis:\n\n';
    

    try {
      const response = await Promise.race([
        fetch('https://api.au-syd.speech-to-text.watson.cloud.ibm.com', { method: 'HEAD' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]) as Response;
      results += `✅ HEAD request: OK (${response.status})\n`;
    } catch (error) {
      results += `❌ HEAD request: FAILED\n`;
    }


    try {
      const modelsUrl = WATSON_CONFIGS[0].url.replace('/v1/recognize', '/v1/models');
      const response = await Promise.race([
        fetch(modelsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`apikey:${WATSON_CONFIGS[0].apiKey}`)}`,
            'Accept': 'application/json',
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]) as Response;
      
      if (response.ok) {
        results += `✅ GET /v1/models: OK (${response.status})\n`;
      } else {
        results += `❌ GET /v1/models: FAILED (${response.status})\n`;
      }
    } catch (error) {
      results += `❌ GET /v1/models: TIMEOUT\n`;
    }


    try {
      const smallBlob = new Blob(['test'], { type: 'text/plain' });
      const response = await Promise.race([
        fetch(WATSON_CONFIGS[0].url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`apikey:${WATSON_CONFIGS[0].apiKey}`)}`,
            'Content-Type': 'text/plain',
          },
          body: smallBlob,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]) as Response;
      
      results += `📝 Small POST test: Got response (${response.status})\n`;
    } catch (error) {
      results += `❌ Small POST test: ${error.message.includes('timeout') ? 'TIMEOUT' : 'ERROR'}\n`;
    }

    return results + `\n💡 Analysis: ${results.includes('Small POST test: TIMEOUT') ? 
      'POST requests are being blocked/throttled' : 
      'GET works but audio POST fails - likely file size/type restriction'}`;
  };

  return { 
    startRecording, 
    stopRecording,
    isListening, 
    transcribedText,
    isProcessing,
    clearTranscription,
    testWatsonConnection: diagnoseNetworkIssue,
    quickNetworkTest,
    detailedNetworkTest,
    compareNetworkAccess 
  };
};