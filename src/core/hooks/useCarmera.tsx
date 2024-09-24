import { CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';

export default function useCarmera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  return {
    facing,
    permission,
    requestPermission,
    toggleCameraFacing,
  };
}
