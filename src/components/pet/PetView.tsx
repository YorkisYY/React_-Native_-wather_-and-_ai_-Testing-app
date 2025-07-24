// src/components/pet/PetView.tsx - 修復版
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

interface PetViewProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
}

export default function PetView({ isListening, isSpeaking, isThinking }: PetViewProps) {
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<Renderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const petRef = useRef<THREE.Group>();
  const animationIdRef = useRef<number>();

  const onContextCreate = (gl: any) => {
    // 設置 renderer
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x000000, 0); // 透明背景
    rendererRef.current = renderer;

    // 設置 scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 設置 camera
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // 創建寵物（簡單的小狗形狀）
    const pet = createDogPet();
    scene.add(pet);
    petRef.current = pet;

    // 添加燈光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 開始動畫循環
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (petRef.current) {
        updatePetAnimation();
      }
      
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  const createDogPet = (): THREE.Group => {
    const dog = new THREE.Group();

    // 身體
    const bodyGeometry = new THREE.CapsuleGeometry(0.6, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xD2691E }); // 棕色
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // 橫放
    dog.add(body);

    // 頭部
    const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xD2691E });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.x = 1.2;
    head.position.y = 0.3;
    dog.add(head);

    // 鼻子
    const noseGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const noseMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.x = 1.8;
    nose.position.y = 0.3;
    dog.add(nose);

    // 眼睛
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(1.6, 0.6, 0.3);
    dog.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(1.6, 0.6, -0.3);
    dog.add(rightEye);

    // 耳朵
    const earGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
    const earMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.8, 1.0, 0.4);
    leftEar.rotation.z = -Math.PI / 6;
    dog.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.8, 1.0, -0.4);
    rightEar.rotation.z = -Math.PI / 6;
    dog.add(rightEar);

    // 尾巴
    const tailGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1.0, 8);
    const tailMaterial = new THREE.MeshPhongMaterial({ color: 0xD2691E });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-1.0, 0.5, 0);
    tail.rotation.z = Math.PI / 4;
    dog.add(tail);

    // 腿
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0xD2691E });
    
    // 前腿
    const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontLeftLeg.position.set(0.5, -0.8, 0.4);
    dog.add(frontLeftLeg);
    
    const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontRightLeg.position.set(0.5, -0.8, -0.4);
    dog.add(frontRightLeg);
    
    // 後腿
    const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    backLeftLeg.position.set(-0.5, -0.8, 0.4);
    dog.add(backLeftLeg);
    
    const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    backRightLeg.position.set(-0.5, -0.8, -0.4);
    dog.add(backRightLeg);

    // 添加引用以便動畫控制
    (dog as any).head = head;
    (dog as any).tail = tail;
    (dog as any).leftEar = leftEar;
    (dog as any).rightEar = rightEar;
    (dog as any).nose = nose;

    return dog;
  };

  const updatePetAnimation = () => {
    if (!petRef.current) return;

    const time = Date.now() * 0.001;
    const dog = petRef.current as any;

    if (isListening) {
      // 聽語音時：耳朵豎起，頭微微傾斜
      dog.head.rotation.z = Math.sin(time * 3) * 0.1;
      dog.leftEar.rotation.z = -Math.PI / 8;
      dog.rightEar.rotation.z = -Math.PI / 8;
      dog.tail.rotation.z = Math.PI / 6 + Math.sin(time * 4) * 0.2; // 輕微搖尾巴
      
      // 鼻子稍微放大（表示專注）
      dog.nose.scale.setScalar(1 + Math.sin(time * 5) * 0.1);
    } else if (isSpeaking) {
      // AI說話時：頭部輕微上下點動，嘴部動作
      dog.head.position.y = 0.3 + Math.sin(time * 8) * 0.05;
      dog.head.rotation.x = Math.sin(time * 6) * 0.1;
      dog.tail.rotation.z = Math.PI / 4 + Math.sin(time * 6) * 0.3; // 興奮搖尾巴
      
      // 鼻子動作（模擬說話）
      dog.nose.scale.setScalar(1 + Math.sin(time * 10) * 0.2);
    } else if (isThinking) {
      // 思考時：頭部慢慢左右轉動
      dog.head.rotation.y = Math.sin(time * 1.5) * 0.3;
      dog.tail.rotation.z = Math.PI / 5; // 尾巴下垂一點
      
      // 耳朵下垂
      dog.leftEar.rotation.z = -Math.PI / 4;
      dog.rightEar.rotation.z = -Math.PI / 4;
    } else {
      // 待機動畫：自然呼吸和偶爾的動作
      const breathe = Math.sin(time * 2) * 0.05;
      petRef.current.scale.y = 1 + breathe;
      
      // 偶爾眨眼效果（通過縮放頭部）
      if (Math.sin(time * 0.5) > 0.9) {
        dog.head.scale.y = 0.9;
      } else {
        dog.head.scale.y = 1;
      }
      
      // 尾巴輕微擺動
      dog.tail.rotation.z = Math.PI / 4 + Math.sin(time * 1.5) * 0.1;
      
      // 耳朵自然狀態
      dog.leftEar.rotation.z = -Math.PI / 6;
      dog.rightEar.rotation.z = -Math.PI / 6;
      
      // 重置鼻子大小
      dog.nose.scale.setScalar(1);
    }

    // 整體輕微浮動效果
    petRef.current.position.y = Math.sin(time * 1.2) * 0.1;
    
    // 整體輕微旋轉（讓寵物看起來更生動）
    petRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
  };

  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 300,
    backgroundColor: 'transparent',
  },
  glView: {
    flex: 1,
  },
});