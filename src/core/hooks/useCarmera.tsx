import { CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useCallback } from 'react';

export default function useCarmera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isPermissionChecked, setIsPermissionChecked] = useState(false);

  // Preload permission check when hook is first used
  useEffect(() => {
    if (!isPermissionChecked) {
      setIsPermissionChecked(true);
      // Pre-request permission to speed up future camera usage
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [permission, requestPermission, isPermissionChecked]);

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const optimizedRequestPermission = useCallback(async () => {
    try {
      const result = await requestPermission();
      return result;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return null;
    }
  }, [requestPermission]);

  return {
    facing,
    permission,
    requestPermission: optimizedRequestPermission,
    toggleCameraFacing,
    isPermissionChecked,
  };
}
