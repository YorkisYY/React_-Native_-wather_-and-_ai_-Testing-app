

import { useState, useEffect, useRef } from 'react';


const useTypewriter = (fullText: string, speed: number = 200) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    if (!fullText) {
      setDisplayedText('');
      setCurrentWordIndex(0);
      return;
    }

    const words = fullText.split(' ');
    
    if (currentWordIndex < words.length) {
      const timeoutId = setTimeout(() => {
        const wordsToShow = words.slice(0, currentWordIndex + 1);
        setDisplayedText(wordsToShow.join(' '));
        setCurrentWordIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeoutId);
    }
  }, [currentWordIndex, fullText, speed]);


  const reset = () => {
    setDisplayedText('');
    setCurrentWordIndex(0);
  };

  useEffect(() => {

    reset();
  }, [fullText]);

  const words = fullText.split(' ');
  return { 
    displayedText, 
    isTyping: currentWordIndex < words.length, 
    reset,
    progress: words.length > 0 ? Math.round((currentWordIndex / words.length) * 100) : 0
  };
};

export const useSpeechAIIntegration = () => {
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [isAiConnected, setIsAiConnected] = useState(false);
  

  const [fullResponseText, setFullResponseText] = useState<string>('');
  

  const { displayedText, isTyping, reset, progress } = useTypewriter(fullResponseText, 200);


  const WATSON_AI_CONFIG = {
    baseUrl: 'https://eu-gb.ml.cloud.ibm.com',
    apiKey: 'AW3LKng2gEmIyQQKt_t_HrptkOUYohh6-Hj_PXKJZQ9E',
    deploymentId: 'ef2426cc-6550-4f32-8e1a-c091339dc58e'
  };


  const getIAMToken = async () => {
    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
        'apikey': WATSON_AI_CONFIG.apiKey
      }).toString()
    });

    const data = await response.json();
    return data.access_token;
  };


  const callNormalAI = async (text: string) => {
    const token = await getIAMToken();
    const url = `${WATSON_AI_CONFIG.baseUrl}/ml/v4/deployments/${WATSON_AI_CONFIG.deploymentId}/ai_service?version=2021-05-01`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ content: text, role: "user" }]
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    return 'No response';
  };


  const sendTextToAIStream = async (text: string): Promise<void> => {
    if (!text || text.trim().length === 0) {
      setAiError('Please enter a message');
      return;
    }

    console.log('Starting AI stream request...');

    setIsProcessingAI(true);
    setAiError('');
    

    reset();
    setFullResponseText('');
    setAiResponse('');

    try {
      console.log('Getting AI response...');
      

      const fullResponse = await callNormalAI(text);
      
      console.log('Got full response, starting typewriter effect...');
      console.log('Response length:', fullResponse.length);
      

      setFullResponseText(fullResponse);
      setAiResponse(fullResponse);
      
      setIsAiConnected(true);
      setIsProcessingAI(false);
      
      console.log('Typewriter effect triggered');
      
    } catch (error) {
      console.error('Error in sendTextToAIStream:', error);
      setAiError(`Watson AI call failed: ${error.message}`);
      setIsAiConnected(false);
      setIsProcessingAI(false);
    }
  };


  const sendTextToAI = async (text: string): Promise<void> => {
    if (!text || text.trim().length === 0) {
      setAiError('Please enter a message');
      return;
    }

    setIsProcessingAI(true);
    setAiError('');
    reset();
    setFullResponseText('');
    setAiResponse('');

    try {
      const response = await callNormalAI(text);
      setAiResponse(response);
      setFullResponseText(response);
      setIsAiConnected(true);
    } catch (error) {
      setAiError(`Watson AI call failed: ${error.message}`);
      setIsAiConnected(false);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const testWatsonAI = async (): Promise<string> => {
    try {
      setIsProcessingAI(true);
      setAiError('');

      const response = await callNormalAI('Hello, please introduce yourself.');
      
      if (response) {
        const testMessage = `Watson AI connection successful!\n\n${response}`;
        setAiResponse(testMessage);
        setFullResponseText(testMessage);
        setIsAiConnected(true);
        return `SUCCESS - ${response}`;
      } else {
        setAiError('Test failed');
        setIsAiConnected(false);
        return 'FAILED - No response';
      }
    } catch (error) {
      const errorMsg = `FAILED - ${error.message}`;
      setAiError(errorMsg);
      setIsAiConnected(false);
      return errorMsg;
    } finally {
      setIsProcessingAI(false);
    }
  };

  return {
    sendTextToAIStream,
    sendTextToAI,
    testWatsonAI,
    

    aiResponse: displayedText, 
    aiResponseFull: aiResponse, 
    isTyping, 
    typingProgress: progress, 
    
    isProcessingAI,
    aiError,
    isAiConnected,
    
    clearAIResults: () => {
      setAiResponse('');
      setFullResponseText('');
      setAiError('');
      reset();
    },
    
    getAIStatus: () => {
      if (isProcessingAI) return 'Processing...';
      if (aiError) return `Error: ${aiError}`;
      if (isAiConnected) return 'Connected';
      return 'Not connected';
    }
  };
};