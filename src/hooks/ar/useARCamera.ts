 // src/hooks/ar/useARCamera.ts
import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export interface CameraPermissions {
  camera: boolean;
  motion: boolean;
}

export interface CameraConfig {
  resolution: 'low' | 'medium' | 'high';
  fps: 30 | 60;
  autofocus: boolean;
  flashMode: 'off' | 'on' | 'auto';
}

export interface CameraTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export const useARCamera = () => {
  const [permissions, setPermissions] = useState<CameraPermissions>({
    camera: false,
    motion: false
  });
  
  const [config, setConfig] = useState<CameraConfig>({
    resolution: 'medium',
    fps: 30,
    autofocus: true,
    flashMode: 'off'
  });
  
  const [transform, setTransform] = useState<CameraTransform>({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });
  
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightLevel, setLightLevel] = useState<number>(1000); // lux
  
  const cameraRef = useRef<any>(null);
  const motionUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // 請求相機權限
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      console.log('📷 Requesting camera permission...');
      
      // 這裡會使用真正的權限 API
      // 目前模擬權限請求
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模擬用戶同意
      const granted = true;
      
      setPermissions(prev => ({ ...prev, camera: granted }));
      
      if (granted) {
        console.log('✅ Camera permission granted');
      } else {
        console.log('❌ Camera permission denied');
        Alert.alert(
          'Camera Permission Required',
          'AR features need camera access to work properly.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // 導向設定頁面的邏輯
            }}
          ]
        );
      }
      
      return granted;
    } catch (err) {
      setError(`Camera permission error: ${err.message}`);
      return false;
    }
  };

  // 請求動作感應權限
  const requestMotionPermission = async (): Promise<boolean> => {
    try {
      console.log('📱 Requesting motion permission...');
      
      // 模擬動作權限請求
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const granted = true;
      setPermissions(prev => ({ ...prev, motion: granted }));
      
      if (granted) {
        console.log('✅ Motion permission granted');
      } else {
        console.log('❌ Motion permission denied');
      }
      
      return granted;
    } catch (err) {
      setError(`Motion permission error: ${err.message}`);
      return false;
    }
  };

  // 請求所有權限
  const requestAllPermissions = async (): Promise<boolean> => {
    const [cameraGranted, motionGranted] = await Promise.all([
      requestCameraPermission(),
      requestMotionPermission()
    ]);
    
    return cameraGranted && motionGranted;
  };

  // 啟動相機
  const startCamera = async (): Promise<boolean> => {
    try {
      if (!permissions.camera) {
        const granted = await requestCameraPermission();
        if (!granted) return false;
      }
      
      console.log('🎥 Starting AR camera...');
      setError(null);
      
      // 模擬相機啟動
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsActive(true);
      startMotionTracking();
      
      console.log('✅ AR camera started');
      return true;
      
    } catch (err) {
      setError(`Camera start error: ${err.message}`);
      return false;
    }
  };

  // 停止相機
  const stopCamera = () => {
    console.log('🛑 Stopping AR camera...');
    
    setIsActive(false);
    setIsRecording(false);
    stopMotionTracking();
    
    if (cameraRef.current) {
      cameraRef.current = null;
    }
    
    console.log('✅ AR camera stopped');
  };

  // 開始動作追蹤
  const startMotionTracking = () => {
    if (!permissions.motion) return;
    
    console.log('🎯 Starting motion tracking...');
    
    // 模擬動作數據更新
    motionUpdateRef.current = setInterval(() => {
      // 模擬相機位置變化
      setTransform(prev => ({
        position: {
          x: prev.position.x + (Math.random() - 0.5) * 0.001,
          y: prev.position.y + (Math.random() - 0.5) * 0.001,
          z: prev.position.z + (Math.random() - 0.5) * 0.001,
        },
        rotation: {
          x: prev.rotation.x + (Math.random() - 0.5) * 0.1,
          y: prev.rotation.y + (Math.random() - 0.5) * 0.1,
          z: prev.rotation.z + (Math.random() - 0.5) * 0.1,
        },
        scale: prev.scale
      }));
      
      // 模擬光照變化
      setLightLevel(prev => {
        const change = (Math.random() - 0.5) * 100;
        return Math.max(100, Math.min(2000, prev + change));
      });
      
    }, 50); // 20fps 更新
  };

  // 停止動作追蹤
  const stopMotionTracking = () => {
    if (motionUpdateRef.current) {
      clearInterval(motionUpdateRef.current);
      motionUpdateRef.current = null;
    }
    console.log('🎯 Motion tracking stopped');
  };

  // 更新相機配置
  const updateConfig = (newConfig: Partial<CameraConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    console.log('⚙️ Camera config updated:', newConfig);
  };

  // 切換手電筒
  const toggleFlash = () => {
    const newMode = config.flashMode === 'off' ? 'on' : 'off';
    updateConfig({ flashMode: newMode });
    console.log(`🔦 Flash ${newMode}`);
  };

  // 拍照功能
  const takePicture = async (): Promise<string | null> => {
    if (!isActive) {
      Alert.alert('Error', 'Camera is not active');
      return null;
    }
    
    try {
      console.log('📸 Taking picture...');
      
      // 模擬拍照過程
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 返回模擬的圖片 URI
      const imageUri = `file://mock_photo_${Date.now()}.jpg`;
      console.log('✅ Picture taken:', imageUri);
      
      return imageUri;
    } catch (err) {
      setError(`Photo capture error: ${err.message}`);
      return null;
    }
  };

  // 開始錄影
  const startRecording = async (): Promise<boolean> => {
    if (!isActive) {
      Alert.alert('Error', 'Camera is not active');
      return false;
    }
    
    try {
      console.log('🎬 Starting video recording...');
      setIsRecording(true);
      return true;
    } catch (err) {
      setError(`Recording start error: ${err.message}`);
      return false;
    }
  };

  // 停止錄影
  const stopRecording = async (): Promise<string | null> => {
    if (!isRecording) return null;
    
    try {
      console.log('⏹️ Stopping video recording...');
      setIsRecording(false);
      
      // 模擬處理時間
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const videoUri = `file://mock_video_${Date.now()}.mp4`;
      console.log('✅ Video saved:', videoUri);
      
      return videoUri;
    } catch (err) {
      setError(`Recording stop error: ${err.message}`);
      return null;
    }
  };

  // 重置相機變換
  const resetTransform = () => {
    setTransform({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    });
    console.log('🔄 Camera transform reset');
  };

  // 獲取光照條件描述
  const getLightCondition = (): string => {
    if (lightLevel < 200) return 'Very Dark';
    if (lightLevel < 500) return 'Dark';
    if (lightLevel < 800) return 'Dim';
    if (lightLevel < 1200) return 'Normal';
    if (lightLevel < 1600) return 'Bright';
    return 'Very Bright';
  };

  // 清理
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 當權限改變時的處理
  useEffect(() => {
    if (permissions.camera && permissions.motion) {
      console.log('✅ All permissions granted - ready for AR');
    }
  }, [permissions]);

  return {
    // 狀態
    permissions,
    config,
    transform,
    isActive,
    isRecording,
    error,
    lightLevel,
    
    // 權限方法
    requestCameraPermission,
    requestMotionPermission,
    requestAllPermissions,
    
    // 相機控制
    startCamera,
    stopCamera,
    updateConfig,
    toggleFlash,
    
    // 動作追蹤
    startMotionTracking,
    stopMotionTracking,
    resetTransform,
    
    // 媒體功能
    takePicture,
    startRecording,
    stopRecording,
    
    // 便利屬性
    hasAllPermissions: permissions.camera && permissions.motion,
    canUseAR: permissions.camera && permissions.motion && isActive,
    getLightCondition,
    
    // 狀態檢查
    isLowLight: lightLevel < 400,
    isBrightLight: lightLevel > 1400,
    isStable: Math.abs(transform.rotation.x) < 5 && Math.abs(transform.rotation.y) < 5,
  };
};
