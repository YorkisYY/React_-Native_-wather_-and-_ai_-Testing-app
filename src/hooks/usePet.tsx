// src/hooks/usePet.ts
import { useState, useEffect } from 'react';

export type PetState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'excited';

export interface PetStatus {
  state: PetState;
  mood: 'neutral' | 'happy' | 'excited' | 'curious';
  energy: number; // 0-100
}

export const usePet = () => {
  const [petStatus, setPetStatus] = useState<PetStatus>({
    state: 'idle',
    mood: 'neutral',
    energy: 80
  });

  // 設置寵物狀態
  const setPetState = (state: PetState) => {
    console.log(`🐕 Pet state changed: ${petStatus.state} → ${state}`);
    setPetStatus(prev => ({
      ...prev,
      state
    }));

    // 根據狀態自動調整心情和能量
    switch (state) {
      case 'listening':
        setPetStatus(prev => ({
          ...prev,
          mood: 'curious',
          energy: Math.min(100, prev.energy + 5)
        }));
        break;
      case 'speaking':
        setPetStatus(prev => ({
          ...prev,
          mood: 'happy',
          energy: Math.max(0, prev.energy - 2)
        }));
        break;
      case 'happy':
        setPetStatus(prev => ({
          ...prev,
          mood: 'excited',
          energy: Math.min(100, prev.energy + 10)
        }));
        break;
      case 'thinking':
        setPetStatus(prev => ({
          ...prev,
          mood: 'curious',
          energy: Math.max(0, prev.energy - 1)
        }));
        break;
    }
  };

  // 自動狀態管理：如果一段時間沒有互動，回到 idle
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (petStatus.state !== 'idle') {
      timeout = setTimeout(() => {
        setPetState('idle');
      }, 5000); // 5秒後回到 idle
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [petStatus.state]);

  // 能量自然恢復
  useEffect(() => {
    const interval = setInterval(() => {
      setPetStatus(prev => ({
        ...prev,
        energy: Math.min(100, prev.energy + 1)
      }));
    }, 10000); // 每10秒恢復1點能量

    return () => clearInterval(interval);
  }, []);

  // 餵食功能（可以增加互動性）
  const feedPet = () => {
    console.log('🍖 Feeding pet...');
    setPetStatus(prev => ({
      ...prev,
      state: 'happy',
      mood: 'excited',
      energy: 100
    }));
  };

  // 寵物說話
  const petSpeak = (duration: number = 3000) => {
    setPetState('speaking');
    setTimeout(() => {
      setPetState('idle');
    }, duration);
  };

  // 寵物聽語音
  const petListen = () => {
    setPetState('listening');
  };

  // 寵物思考
  const petThink = () => {
    setPetState('thinking');
  };

  // 獲取寵物狀態描述
  const getPetStatusDescription = (): string => {
    const { state, mood, energy } = petStatus;
    
    let description = '';
    
    switch (state) {
      case 'idle':
        description = energy > 70 ? '我很精神！' : energy > 30 ? '我還好～' : '我有點累了...';
        break;
      case 'listening':
        description = '我在認真聽你說話！';
        break;
      case 'thinking':
        description = '讓我想想...';
        break;
      case 'speaking':
        description = '我有話要說！';
        break;
      case 'happy':
        description = '我很開心！';
        break;
      case 'excited':
        description = '哇！太棒了！';
        break;
    }

    return description;
  };

  return {
    petStatus,
    setPetState,
    feedPet,
    petSpeak,
    petListen,
    petThink,
    getPetStatusDescription,
    
    // 便於組件使用的布林值
    isIdle: petStatus.state === 'idle',
    isListening: petStatus.state === 'listening',
    isThinking: petStatus.state === 'thinking',
    isSpeaking: petStatus.state === 'speaking',
    isHappy: petStatus.state === 'happy',
    isExcited: petStatus.state === 'excited',
  };
};