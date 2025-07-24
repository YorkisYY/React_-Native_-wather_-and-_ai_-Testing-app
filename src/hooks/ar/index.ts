 // src/hooks/ar/index.ts
export { useAR } from './useAR';
export { useARPet } from './useARPet';
export { useARCamera } from './useARCamera';

// 重新導出類型
export type { 
  ARStatus, 
  ARTrackingState, 
  ARSession, 
  ARPlane 
} from './useAR';

export type { 
  PetType, 
  PetState, 
  PetAnimation, 
  PetPosition, 
  PetRotation, 
  ARPetConfig, 
  PetStats 
} from './useARPet';

export type { 
  CameraPermissions, 
  CameraConfig, 
  CameraTransform 
} from './useARCamera';
