 // src/hooks/ar/useARPet.ts
import { useState, useEffect, useRef } from 'react';
import { ARPlane } from './useAR';

export type PetType = 'dog' | 'cat' | 'bird' | 'panda';
export type PetState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'playing' | 'sleeping';
export type PetAnimation = 'walk' | 'sit' | 'jump' | 'wag_tail' | 'nod' | 'shake' | 'dance';

export interface PetPosition {
  x: number;
  y: number;
  z: number;
}

export interface PetRotation {
  x: number;
  y: number;
  z: number;
}

export interface ARPetConfig {
  type: PetType;
  size: number; // 0.5 - 2.0
  position: PetPosition;
  rotation: PetRotation;
  name: string;
}

export interface PetStats {
  energy: number; // 0-100
  happiness: number; // 0-100
  attention: number; // 0-100
  lastInteraction: Date | null;
}

export const useARPet = (initialConfig?: Partial<ARPetConfig>) => {
  const [config, setConfig] = useState<ARPetConfig>({
    type: 'dog',
    size: 1.0,
    position: { x: 0, y: 0, z: -1 },
    rotation: { x: 0, y: 0, z: 0 },
    name: 'Buddy',
    ...initialConfig
  });

  const [petState, setPetState] = useState<PetState>('idle');
  const [currentAnimation, setCurrentAnimation] = useState<PetAnimation | null>(null);
  const [stats, setStats] = useState<PetStats>({
    energy: 80,
    happiness: 75,
    attention: 60,
    lastInteraction: null
  });

  const [isVisible, setIsVisible] = useState(true);
  const [targetPlane, setTargetPlane] = useState<ARPlane | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 設置寵物類型
  const setPetType = (type: PetType) => {
    setConfig(prev => ({ ...prev, type }));
    console.log(`🐾 Pet type changed to: ${type}`);
  };

  // 設置寵物位置
  const setPetPosition = (position: Partial<PetPosition>) => {
    setConfig(prev => ({
      ...prev,
      position: { ...prev.position, ...position }
    }));
  };

  // 設置寵物旋轉
  const setPetRotation = (rotation: Partial<PetRotation>) => {
    setConfig(prev => ({
      ...prev,
      rotation: { ...prev.rotation, ...rotation }
    }));
  };

  // 設置寵物大小
  const setPetSize = (size: number) => {
    const clampedSize = Math.max(0.5, Math.min(2.0, size));
    setConfig(prev => ({ ...prev, size: clampedSize }));
  };

  // 播放動畫
  const playAnimation = (animation: PetAnimation, duration: number = 2000) => {
    console.log(`🎭 Playing animation: ${animation}`);
    setCurrentAnimation(animation);
    
    // 清除之前的定時器
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    // 設定動畫結束時間
    animationTimeoutRef.current = setTimeout(() => {
      setCurrentAnimation(null);
      console.log(`🎭 Animation completed: ${animation}`);
    }, duration);
  };

  // 寵物狀態變更
  const changePetState = (newState: PetState) => {
    console.log(`🐾 Pet state: ${petState} → ${newState}`);
    setPetState(newState);
    
    // 更新統計
    setStats(prev => ({
      ...prev,
      lastInteraction: new Date(),
      attention: Math.min(100, prev.attention + 5)
    }));

    // 根據狀態播放對應動畫
    switch (newState) {
      case 'listening':
        playAnimation('sit', 3000);
        break;
      case 'thinking':
        playAnimation('nod', 1500);
        break;
      case 'speaking':
        playAnimation('wag_tail', 2500);
        break;
      case 'playing':
        playAnimation('jump', 1000);
        break;
    }
  };

  // 移動寵物到平面
  const moveToPlatform = (plane: ARPlane) => {
    console.log(`🚶 Moving pet to plane: ${plane.id}`);
    setIsMoving(true);
    setTargetPlane(plane);
    
    // 計算新位置（平面中心稍微上方）
    const newPosition: PetPosition = {
      x: plane.center.x,
      y: plane.center.y + 0.1, // 稍微高於平面
      z: plane.center.z
    };
    
    // 播放行走動畫
    playAnimation('walk', 2000);
    
    // 模擬移動過程
    setTimeout(() => {
      setPetPosition(newPosition);
      setIsMoving(false);
      changePetState('idle');
      console.log(`✅ Pet arrived at plane: ${plane.id}`);
    }, 2000);
  };

  // 餵食寵物
  const feedPet = () => {
    console.log('🍖 Feeding pet...');
    changePetState('playing');
    playAnimation('jump', 1500);
    
    setStats(prev => ({
      ...prev,
      energy: Math.min(100, prev.energy + 20),
      happiness: Math.min(100, prev.happiness + 15),
      lastInteraction: new Date()
    }));
    
    setTimeout(() => {
      changePetState('idle');
    }, 2000);
  };

  // 撫摸寵物
  const petTheAnimal = () => {
    console.log('🤚 Petting the animal...');
    changePetState('playing');
    playAnimation('wag_tail', 2000);
    
    setStats(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 10),
      attention: Math.min(100, prev.attention + 15),
      lastInteraction: new Date()
    }));
    
    setTimeout(() => {
      changePetState('idle');
    }, 2500);
  };

  // 讓寵物跳舞
  const makePetDance = () => {
    console.log('💃 Pet is dancing!');
    changePetState('playing');
    playAnimation('dance', 3000);
    
    setStats(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 25),
      energy: Math.max(0, prev.energy - 10),
      lastInteraction: new Date()
    }));
    
    setTimeout(() => {
      changePetState('idle');
    }, 3500);
  };

  // 讓寵物面向用戶
  const lookAtUser = () => {
    console.log('👁️ Pet looking at user');
    // 假設用戶在原點前方
    const angleToUser = Math.atan2(0 - config.position.x, 0 - config.position.z);
    setPetRotation({ 
      x: 0, 
      y: angleToUser * (180 / Math.PI), 
      z: 0 
    });
    playAnimation('nod', 1000);
  };

  // 重置寵物位置
  const resetPosition = () => {
    console.log('🔄 Resetting pet position');
    setPetPosition({ x: 0, y: 0, z: -1 });
    setPetRotation({ x: 0, y: 0, z: 0 });
    setTargetPlane(null);
  };

  // 隱藏/顯示寵物
  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
    console.log(`👁️ Pet visibility: ${!isVisible}`);
  };

  // 獲取寵物心情描述
  const getMoodDescription = (): string => {
    const { happiness, energy, attention } = stats;
    
    if (happiness >= 80 && energy >= 70) return '😊 Very Happy';
    if (happiness >= 60 && energy >= 50) return '🙂 Happy';
    if (happiness >= 40 && energy >= 30) return '😐 Neutral';
    if (happiness >= 20 && energy >= 10) return '😕 Sad';
    return '😴 Tired';
  };

  // 獲取需要注意的事項
  const getNeeds = (): string[] => {
    const needs: string[] = [];
    
    if (stats.energy < 30) needs.push('🔋 Needs rest');
    if (stats.happiness < 40) needs.push('🎾 Wants to play');
    if (stats.attention < 20) needs.push('👋 Needs attention');
    
    return needs;
  };

  // 自動狀態更新
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => {
        const timeSinceInteraction = prev.lastInteraction 
          ? Date.now() - prev.lastInteraction.getTime()
          : Infinity;
        
        // 時間越久，數值下降越多
        const hoursSinceInteraction = timeSinceInteraction / (1000 * 60 * 60);
        
        return {
          ...prev,
          energy: Math.max(0, prev.energy - 0.5),
          happiness: Math.max(0, prev.happiness - (hoursSinceInteraction > 1 ? 1 : 0.2)),
          attention: Math.max(0, prev.attention - (hoursSinceInteraction > 0.5 ? 2 : 0.5))
        };
      });
    }, 30000); // 每30秒更新一次
    
    return () => clearInterval(interval);
  }, []);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 配置
    config,
    setPetType,
    setPetPosition,
    setPetRotation,
    setPetSize,
    
    // 狀態
    petState,
    currentAnimation,
    stats,
    isVisible,
    targetPlane,
    isMoving,
    
    // 動作
    changePetState,
    playAnimation,
    moveToPlatform,
    feedPet,
    petTheAnimal,
    makePetDance,
    lookAtUser,
    resetPosition,
    toggleVisibility,
    
    // 信息
    getMoodDescription,
    getNeeds,
    
    // 便利屬性
    isIdle: petState === 'idle',
    isListening: petState === 'listening',
    isThinking: petState === 'thinking',
    isSpeaking: petState === 'speaking',
    isPlaying: petState === 'playing',
    needsAttention: stats.attention < 30,
    isHappy: stats.happiness >= 60,
    isEnergetic: stats.energy >= 50,
  };
};
