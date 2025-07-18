import React, { useState, useEffect } from 'react';

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
    apiKey: '9hZtqy6PhM-zml8zuEAkfUihkHECwQSRVQApdrx7vToz',
    deploymentId: '331b85e6-8e2c-4af2-81b4-04baaf115dba'
  };

  const getIAMToken = async () => {
    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WATSON_AI_CONFIG.apiKey}`
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get IAM token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error(`No access token in IAM response: ${JSON.stringify(data)}`);
    }
    
    return data.access_token;
  };

  const callNormalAI = async (text: string) => {
    const token = await getIAMToken();
    
    const url = `${WATSON_AI_CONFIG.baseUrl}/ml/v4/deployments/${WATSON_AI_CONFIG.deploymentId}/ai_service?version=2021-05-01`;
    
    // 使用官方格式
    const requestBody = {
      "messages": [
        {
          "content": text,
          "role": "user"
        }
      ]
    };

    console.log('發送的請求體:', JSON.stringify(requestBody, null, 2));
    console.log('請求 URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('響應狀態:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('錯誤響應內容:', errorText);
      throw new Error(`HTTP Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Watson AI 完整響應:', JSON.stringify(data, null, 2));
    
    return parseResponse(data);
  };

  const parseResponse = (data: any): string => {
    console.log('解析響應數據:', JSON.stringify(data, null, 2));
    
    // 聊天響應格式
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];
      if (choice.message && choice.message.content) {
        return choice.message.content;
      }
      if (choice.text) {
        return choice.text;
      }
    }
    
    // 生成式 AI 響應
    if (data.results && data.results[0]) {
      return data.results[0].generated_text || data.results[0];
    }
    
    // 直接文本響應
    if (typeof data === 'string') {
      return data;
    }
    
    // 其他可能的格式
    if (data.generated_text) {
      return data.generated_text;
    }
    
    if (data.result) {
      return data.result;
    }
    
    if (data.response) {
      return data.response;
    }
    
    if (data.content) {
      return data.content;
    }
    
    if (data.text) {
      return data.text;
    }
    
    throw new Error(`無法解析響應格式: ${JSON.stringify(data)}`);
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
      
      if (response && response.trim().length > 0) {
        const testMessage = `Watson AI connection successful!\n\n${response}`;
        setAiResponse(testMessage);
        setFullResponseText(testMessage);
        setIsAiConnected(true);
        return `SUCCESS - ${response}`;
      } else {
        throw new Error('Empty response from Watson AI');
      }
    } catch (error) {
      console.error('Watson AI test failed:', error);
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