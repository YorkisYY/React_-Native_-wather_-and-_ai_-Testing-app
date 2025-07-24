// src/components/ar/CameraARView.tsx - 相機 AR 組件
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

interface CameraARViewProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  petStatus: any;
  onExit: () => void;
}

export default function CameraARView({ isListening, isSpeaking, isThinking, petStatus, onExit }: CameraARViewProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isARReady, setIsARReady] = useState(false);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<Renderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const petRef = useRef<THREE.Group>();
  const animationIdRef = useRef<number>();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const onGLContextCreate = (gl: any) => {
    console.log('🎥 Starting Camera AR...');
    
    // 設置透明 renderer（讓相機畫面透過）
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x000000, 0); // 完全透明
    renderer.autoClear = false;
    rendererRef.current = renderer;

    // 設置場景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // AR 相機（模擬手機相機視角）
    const camera = new THREE.PerspectiveCamera(
      75, // FOV
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.01,
      1000
    );
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // 創建 AR 寵物
    const pet = createARPet();
    pet.position.set(0, -0.8, -1.5); // 放在用戶前方
    scene.add(pet);
    petRef.current = pet;

    // 環境光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(2, 2, 1);
    scene.add(directionalLight);

    // 開始渲染
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (petRef.current) {
        updateARAnimation();
      }
      
      // 清除背景，讓相機畫面透過
      renderer.clear();
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    
    setIsARReady(true);
    animate();
    console.log('✅ Camera AR Ready!');
  };

  const createARPet = (): THREE.Group => {
    const pet = new THREE.Group();

    // 身體
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.25);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xD2691E,
      transparent: true,
      opacity: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.3, 0);
    pet.add(body);

    // 頭部
    const headGeometry = new THREE.SphereGeometry(0.18, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xD2691E,
      transparent: true,
      opacity: 0.9
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.3, 0.4, 0);
    pet.add(head);

    // 鼻子
    const noseGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const noseMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0.42, 0.4, 0);
    pet.add(nose);

    // 眼睛
    const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.38, 0.48, 0.08);
    pet.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.38, 0.48, -0.08);
    pet.add(rightEye);

    // 耳朵
    const earGeometry = new THREE.ConeGeometry(0.06, 0.12, 8);
    const earMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xA0522D,
      transparent: true,
      opacity: 0.9
    });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.22, 0.55, 0.08);
    leftEar.rotation.z = -Math.PI / 6;
    pet.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.22, 0.55, -0.08);
    rightEar.rotation.z = -Math.PI / 6;
    pet.add(rightEar);

    // 尾巴
    const tailGeometry = new THREE.CylinderGeometry(0.015, 0.03, 0.2, 8);
    const tailMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xD2691E,
      transparent: true,
      opacity: 0.9
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-0.22, 0.4, 0);
    tail.rotation.z = Math.PI / 4;
    pet.add(tail);

    // 腿
    const legGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.15, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xD2691E,
      transparent: true,
      opacity: 0.9
    });
    
    const legPositions = [
      [0.15, 0.15, 0.08],   // 前左
      [0.15, 0.15, -0.08],  // 前右
      [-0.1, 0.15, 0.08],   // 後左
      [-0.1, 0.15, -0.08],  // 後右
    ];
    
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x, y, z);
      pet.add(leg);
    });

    // 地面陰影
    const shadowGeometry = new THREE.RingGeometry(0.1, 0.35, 32);
    const shadowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    pet.add(shadow);

    // 保存引用
    (pet as any).head = head;
    (pet as any).tail = tail;
    (pet as any).leftEar = leftEar;
    (pet as any).rightEar = rightEar;
    (pet as any).nose = nose;
    (pet as any).body = body;

    return pet;
  };

  const updateARAnimation = () => {
    if (!petRef.current) return;

    const time = Date.now() * 0.001;
    const pet = petRef.current as any;

    if (isListening) {
      // 聽語音：耳朵豎起，頭轉向用戶
      pet.head.rotation.y = Math.sin(time * 2) * 0.2;
      pet.head.rotation.z = Math.sin(time * 3) * 0.1;
      pet.leftEar.rotation.z = -Math.PI / 8;
      pet.rightEar.rotation.z = -Math.PI / 8;
      pet.tail.rotation.z = Math.PI / 6 + Math.sin(time * 4) * 0.3;
      
      // 身體輕微前傾（專注聽）
      pet.body.rotation.x = -0.1;
    } else if (isSpeaking) {
      // 說話：頭部點動，興奮搖尾巴
      pet.head.position.y = 0.4 + Math.sin(time * 8) * 0.03;
      pet.head.rotation.x = Math.sin(time * 6) * 0.15;
      pet.tail.rotation.z = Math.PI / 4 + Math.sin(time * 8) * 0.4;
      pet.nose.scale.setScalar(1 + Math.sin(time * 12) * 0.3);
      
      // 身體輕微搖擺
      pet.body.rotation.z = Math.sin(time * 4) * 0.05;
    } else if (isThinking) {
      // 思考：頭部緩慢轉動，耳朵下垂
      pet.head.rotation.y = Math.sin(time * 1.2) * 0.4;
      pet.head.rotation.x = Math.sin(time * 0.8) * 0.1;
      pet.leftEar.rotation.z = -Math.PI / 3;
      pet.rightEar.rotation.z = -Math.PI / 3;
      pet.tail.rotation.z = Math.PI / 6;
      
      // 身體稍微下沉（思考姿態）
      pet.body.position.y = 0.28;
    } else {
      // 待機：自然呼吸和隨機動作
      const breathe = Math.sin(time * 2) * 0.02;
      petRef.current.scale.y = 1 + breathe;
      
      pet.tail.rotation.z = Math.PI / 4 + Math.sin(time * 1.5) * 0.15;
      pet.leftEar.rotation.z = -Math.PI / 6;
      pet.rightEar.rotation.z = -Math.PI / 6;
      pet.nose.scale.setScalar(1);
      pet.body.rotation.x = 0;
      pet.body.rotation.z = 0;
      pet.body.position.y = 0.3;
      
      // 偶爾轉頭環顧
      if (Math.sin(time * 0.3) > 0.7) {
        pet.head.rotation.y = Math.sin(time * 0.8) * 0.6;
      } else {
        pet.head.rotation.y = 0;
      }
      pet.head.rotation.x = 0;
    }

    // 整體輕微浮動
    petRef.current.position.y = -0.8 + Math.sin(time * 1.2) * 0.02;
    
    // 輕微搖擺，讓寵物看起來更生動
    petRef.current.rotation.y = Math.sin(time * 0.5) * 0.05;
  };

  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission required for AR</Text>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 相機背景 */}
      <Camera style={styles.camera} type={Camera.Constants.Type.back} />
      
      {/* AR 3D 層 */}
      <GLView style={styles.arOverlay} onContextCreate={onGLContextCreate} />
      
      {/* 狀態顯示 */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {!isARReady ? '🔄 Loading AR...' : '✅ AR Active'}
        </Text>
        <Text style={styles.petStatusText}>
          Pet: {isListening ? '👂 Listening' : isSpeaking ? '🗣️ Speaking' : isThinking ? '🤔 Thinking' : '😊 Idle'}
        </Text>
        <Text style={styles.petStatsText}>
          Energy: {petStatus.energy}/100 | Mood: {petStatus.mood}
        </Text>
      </View>
      
      {/* 控制按鈕 */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitText}>❌ Exit AR</Text>
        </TouchableOpacity>
      </View>
      
      {/* 使用說明 */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          🎯 Your pet is floating in front of you
        </Text>
        <Text style={styles.instructionText}>
          📱 Move your phone to see different angles
        </Text>
        <Text style={styles.instructionText}>
          🗣️ Talk to your pet and watch it react!
        </Text>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  statusBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  petStatusText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 3,
  },
  petStatsText: {
    color: '#999',
    fontSize: 12,
  },
  controls: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  exitButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
});