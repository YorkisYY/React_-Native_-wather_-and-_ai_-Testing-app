// src/components/ar/ExpoCameraAR.tsx - 只保留Exit AR按钮
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Svg, Circle, Ellipse, Path } from 'react-native-svg';

interface ExpoCameraARProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  petStatus: any;
  onExit: () => void;
  onDebugInfo?: (info: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ExpoCameraAR({
  isListening,
  isSpeaking,
  isThinking,
  petStatus,
  onExit,
  onDebugInfo
}: ExpoCameraARProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [petPosition, setPetPosition] = useState({ x: 0.5, y: 0.7 });
  const [currentState, setCurrentState] = useState('idle');
  
  // 动画值
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tailWagAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  // 请求相机权限
  useEffect(() => {
    if (!permission?.granted) {
      requestCameraPermission();
    }
  }, []);

  // 同步宠物状态
  useEffect(() => {
    const newState = isListening ? 'listening' : isSpeaking ? 'speaking' : isThinking ? 'thinking' : 'idle';
    setCurrentState(newState);
    updateDebugInfo(`Pet state: ${newState}`);
    startStateAnimation(newState);
  }, [isListening, isSpeaking, isThinking]);

  const updateDebugInfo = (info: string) => {
    onDebugInfo?.(info);
    console.log('🐕 Expo AR:', info);
  };

  const requestCameraPermission = async () => {
    try {
      updateDebugInfo('Requesting Expo camera permission...');
      const response = await requestPermission();
      
      if (response?.granted) {
        updateDebugInfo('Expo camera permission granted');
      } else {
        updateDebugInfo('Expo camera permission denied');
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to show your AR pet.',
          [
            { text: 'Exit', onPress: onExit },
            { text: 'Retry', onPress: requestCameraPermission }
          ]
        );
      }
    } catch (error) {
      updateDebugInfo(`Permission error: ${error.message}`);
    }
  };

  const startStateAnimation = (state: string) => {
    // 停止之前的动画
    bounceAnim.stopAnimation();
    scaleAnim.stopAnimation();
    tailWagAnim.stopAnimation();

    switch (state) {
      case 'listening':
        // 听取状态：轻微跳动和尾巴快速摆动
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, { toValue: -10, duration: 300, useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          ])
        ).start();
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(tailWagAnim, { toValue: 30, duration: 200, useNativeDriver: true }),
            Animated.timing(tailWagAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
          ])
        ).start();
        
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }).start();
        break;

      case 'speaking':
        // 说话状态：活跃跳动
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, { toValue: -15, duration: 200, useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          ])
        ).start();
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(tailWagAnim, { toValue: 45, duration: 150, useNativeDriver: true }),
            Animated.timing(tailWagAnim, { toValue: -45, duration: 150, useNativeDriver: true }),
          ])
        ).start();
        
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }).start();
        break;

      case 'thinking':
        // 思考状态：缓慢呼吸
        Animated.loop(
          Animated.sequence([
            Animated.timing(breatheAnim, { toValue: 0.95, duration: 1000, useNativeDriver: true }),
            Animated.timing(breatheAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ])
        ).start();
        
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 500, useNativeDriver: true }).start();
        Animated.timing(tailWagAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
        break;

      default: // idle
        // 空闲状态：温和呼吸和偶尔尾巴摆动
        Animated.loop(
          Animated.sequence([
            Animated.timing(breatheAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
            Animated.timing(breatheAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          ])
        ).start();
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(tailWagAnim, { toValue: 15, duration: 800, useNativeDriver: true }),
            Animated.timing(tailWagAnim, { toValue: -15, duration: 800, useNativeDriver: true }),
          ])
        ).start();
        
        Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        break;
    }
  };

  const handleScreenTouch = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const newX = Math.max(0.1, Math.min(0.9, locationX / screenWidth));
    const newY = Math.max(0.2, Math.min(0.8, locationY / screenHeight));
    
    setPetPosition({ x: newX, y: newY });
    updateDebugInfo(`Pet moved to (${(newX * 100).toFixed(1)}%, ${(newY * 100).toFixed(1)}%)`);
    
    // 移动时的小动画
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const renderPet = () => {
    const petX = petPosition.x * screenWidth;
    const petY = petPosition.y * screenHeight;
    const size = 120;

    return (
      <Animated.View
        style={[
          styles.petContainer,
          {
            left: petX - size / 2,
            top: petY - size / 2,
            transform: [
              { translateY: bounceAnim },
              { scale: Animated.multiply(scaleAnim, breatheAnim) }
            ]
          }
        ]}
        pointerEvents="none"
      >
        <Svg width={size} height={size} viewBox="0 0 120 120">
          {/* 阴影 */}
          <Ellipse cx="60" cy="100" rx="35" ry="8" fill="rgba(0,0,0,0.3)" />
          
          {/* 身体 */}
          <Ellipse cx="60" cy="70" rx="25" ry="15" fill="#D2691E" />
          
          {/* 头部 */}
          <Circle cx="75" cy="55" r="18" fill="#D2691E" />
          
          {/* 耳朵 */}
          <Ellipse cx="68" cy="42" rx="6" ry="10" fill="#A0522D" transform="rotate(-20 68 42)" />
          <Ellipse cx="82" cy="42" rx="6" ry="10" fill="#A0522D" transform="rotate(20 82 42)" />
          
          {/* 眼睛 */}
          <Circle cx="72" cy="50" r="2" fill="#000" />
          <Circle cx="78" cy="50" r="2" fill="#000" />
          <Circle cx="72.5" cy="49.5" r="0.8" fill="#fff" />
          <Circle cx="78.5" cy="49.5" r="0.8" fill="#fff" />
          
          {/* 鼻子 */}
          <Circle cx="75" cy="58" r="1.5" fill="#000" />
          
          {/* 腿 */}
          <Circle cx="50" cy="85" r="3" fill="#D2691E" />
          <Circle cx="70" cy="85" r="3" fill="#D2691E" />
          <Circle cx="50" cy="75" r="3" fill="#D2691E" />
          <Circle cx="70" cy="75" r="3" fill="#D2691E" />
          
          {/* 尾巴 */}
          <Animated.View style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            transform: [{ 
              rotate: tailWagAnim.interpolate({
                inputRange: [-45, 45],
                outputRange: ['-45deg', '45deg']
              }) 
            }] 
          }}>
            <Svg width={size} height={size} viewBox="0 0 120 120">
              <Path 
                d="M 35 70 Q 20 60 15 45" 
                stroke="#D2691E" 
                strokeWidth="4" 
                fill="none" 
                strokeLinecap="round" 
              />
            </Svg>
          </Animated.View>
        </Svg>
      </Animated.View>
    );
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingTitle}>📷 Loading Camera</Text>
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>📷 Camera Access Required</Text>
          <Text style={styles.permissionText}>
            To see your AR pet, we need access to your camera.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={requestCameraPermission}>
            <Text style={styles.retryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitButton} onPress={onExit}>
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={StyleSheet.absoluteFillObject} 
        onPress={handleScreenTouch}
        activeOpacity={1}
      >
        <CameraView 
          style={StyleSheet.absoluteFillObject}
          facing="back"
        />
      </TouchableOpacity>
      
      {/* AR 宠物覆盖层 */}
      {renderPet()}
      
      {/* 只保留退出按钮 */}
      <TouchableOpacity style={styles.exitButtonTop} onPress={onExit}>
        <Text style={styles.exitButtonText}>Exit AR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  petContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  exitButtonTop: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 200,
  },
  exitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  exitButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
});