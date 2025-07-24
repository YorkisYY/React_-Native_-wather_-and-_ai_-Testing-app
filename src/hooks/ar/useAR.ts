 // src/hooks/ar/useAR.ts
import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export type ARStatus = 'not_started' | 'initializing' | 'tracking' | 'paused' | 'failed';
export type ARTrackingState = 'not_available' | 'limited' | 'normal';

export interface ARSession {
  isActive: boolean;
  trackingState: ARTrackingState;
  lightEstimate?: number;
  camera?: any;
}

export interface ARPlane {
  id: string;
  center: { x: number; y: number; z: number };
  extent: { width: number; height: number };
  alignment: 'horizontal' | 'vertical';
}

export const useAR = () => {
  const [arStatus, setArStatus] = useState<ARStatus>('not_started');
  const [session, setSession] = useState<ARSession | null>(null);
  const [planes, setPlanes] = useState<ARPlane[]>([]);
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<any>(null);

  // 檢查設備是否支援 AR
  const checkARSupport = async (): Promise<boolean> => {
    try {
      // 這裡會檢查真正的 AR 支援
      // 目前先模擬，之後整合真正的 AR 庫時會替換
      
      // 模擬檢查過程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 假設大部分設備都支援
      const supported = true;
      setIsARSupported(supported);
      
      if (!supported) {
        setError('AR not supported on this device');
      }
      
      return supported;
    } catch (err) {
      setError(`AR support check failed: ${err.message}`);
      setIsARSupported(false);
      return false;
    }
  };

  // 初始化 AR Session
  const initializeAR = async (): Promise<boolean> => {
    try {
      setArStatus('initializing');
      setError(null);

      // 檢查 AR 支援
      const supported = await checkARSupport();
      if (!supported) {
        throw new Error('AR not supported');
      }

      // 模擬 AR 初始化過程
      console.log('🔄 Initializing AR session...');
      
      // 模擬初始化延遲
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 創建模擬 session
      const newSession: ARSession = {
        isActive: true,
        trackingState: 'normal',
        lightEstimate: 1000,
        camera: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 }
        }
      };
      
      setSession(newSession);
      sessionRef.current = newSession;
      setArStatus('tracking');
      
      console.log('✅ AR session initialized successfully');
      return true;
      
    } catch (err) {
      console.error('❌ AR initialization failed:', err);
      setError(`AR initialization failed: ${err.message}`);
      setArStatus('failed');
      return false;
    }
  };

  // 暫停 AR
  const pauseAR = () => {
    if (session && session.isActive) {
      setArStatus('paused');
      setSession(prev => prev ? { ...prev, isActive: false } : null);
      console.log('⏸️ AR session paused');
    }
  };

  // 恢復 AR
  const resumeAR = () => {
    if (session && !session.isActive) {
      setArStatus('tracking');
      setSession(prev => prev ? { ...prev, isActive: true } : null);
      console.log('▶️ AR session resumed');
    }
  };

  // 停止 AR
  const stopAR = () => {
    if (sessionRef.current) {
      console.log('🛑 Stopping AR session...');
      sessionRef.current = null;
    }
    
    setSession(null);
    setPlanes([]);
    setArStatus('not_started');
    setError(null);
    console.log('✅ AR session stopped');
  };

  // 添加平面（模擬平面檢測）
  const addPlane = (plane: ARPlane) => {
    setPlanes(prev => {
      const existing = prev.find(p => p.id === plane.id);
      if (existing) {
        // 更新現有平面
        return prev.map(p => p.id === plane.id ? plane : p);
      } else {
        // 添加新平面
        console.log(`🔍 New plane detected: ${plane.id} (${plane.alignment})`);
        return [...prev, plane];
      }
    });
  };

  // 移除平面
  const removePlane = (planeId: string) => {
    setPlanes(prev => {
      const filtered = prev.filter(p => p.id !== planeId);
      console.log(`🗑️ Plane removed: ${planeId}`);
      return filtered;
    });
  };

  // 獲取狀態描述
  const getStatusDescription = (): string => {
    switch (arStatus) {
      case 'not_started': return 'AR Not Started';
      case 'initializing': return 'Initializing AR...';
      case 'tracking': return 'AR Tracking Active';
      case 'paused': return 'AR Paused';
      case 'failed': return 'AR Failed';
      default: return 'Unknown Status';
    }
  };

  // 獲取追蹤狀態描述
  const getTrackingDescription = (): string => {
    if (!session) return 'No Session';
    
    switch (session.trackingState) {
      case 'not_available': return 'Tracking Unavailable';
      case 'limited': return 'Limited Tracking';
      case 'normal': return 'Normal Tracking';
      default: return 'Unknown Tracking';
    }
  };

  // 模擬平面檢測（用於測試）
  const simulatePlaneDetection = () => {
    if (arStatus !== 'tracking') return;
    
    const mockPlane: ARPlane = {
      id: `plane_${Date.now()}`,
      center: { 
        x: (Math.random() - 0.5) * 2, 
        y: -1, 
        z: (Math.random() - 0.5) * 2 
      },
      extent: { 
        width: Math.random() * 2 + 0.5, 
        height: Math.random() * 2 + 0.5 
      },
      alignment: Math.random() > 0.5 ? 'horizontal' : 'vertical'
    };
    
    addPlane(mockPlane);
  };

  // 清理
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        stopAR();
      }
    };
  }, []);

  // 模擬定期更新追蹤狀態
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (arStatus === 'tracking') {
      interval = setInterval(() => {
        // 模擬追蹤狀態變化
        setSession(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            lightEstimate: 800 + Math.random() * 400, // 800-1200
            camera: {
              position: {
                x: prev.camera?.position.x + (Math.random() - 0.5) * 0.01,
                y: prev.camera?.position.y + (Math.random() - 0.5) * 0.01,
                z: prev.camera?.position.z + (Math.random() - 0.5) * 0.01,
              },
              rotation: prev.camera?.rotation
            }
          };
        });
      }, 100); // 10fps 更新
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [arStatus]);

  return {
    // 狀態
    arStatus,
    session,
    planes,
    isARSupported,
    error,
    
    // 方法
    initializeAR,
    pauseAR,
    resumeAR,
    stopAR,
    checkARSupport,
    addPlane,
    removePlane,
    simulatePlaneDetection,
    
    // 便利屬性
    isInitializing: arStatus === 'initializing',
    isTracking: arStatus === 'tracking',
    isPaused: arStatus === 'paused',
    hasFailed: arStatus === 'failed',
    isReady: arStatus === 'tracking' && session?.isActive,
    
    // 描述
    getStatusDescription,
    getTrackingDescription,
    
    // 統計
    planeCount: planes.length,
    horizontalPlanes: planes.filter(p => p.alignment === 'horizontal').length,
    verticalPlanes: planes.filter(p => p.alignment === 'vertical').length,
  };
};
