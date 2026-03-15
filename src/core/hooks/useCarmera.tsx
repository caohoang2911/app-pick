import { useCallback, useEffect } from 'react';
import { useCameraPermission } from 'react-native-vision-camera';

export default function useCarmera() {
  const { hasPermission, requestPermission: vcRequestPermission } =
    useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      vcRequestPermission();
    }
  }, []);

  const permission = {
    granted: hasPermission,
    canAskAgain: true,
  };

  const requestPermission = useCallback(async () => {
    try {
      const granted = await vcRequestPermission();
      return { granted, canAskAgain: true };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return null;
    }
  }, [vcRequestPermission]);

  return {
    facing: 'back' as const,
    permission,
    requestPermission,
    toggleCameraFacing: () => {},
    isPermissionChecked: true,
  };
}
