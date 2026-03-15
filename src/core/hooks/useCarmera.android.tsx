import { CameraType, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export default function useCarmera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isPermissionChecked, setIsPermissionChecked] = useState(false);

  // Preload permission check when hook is first used
  useEffect(() => {
    if (!isPermissionChecked) {
      setIsPermissionChecked(true);
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [permission, requestPermission, isPermissionChecked]);

  // Re-check permission when app comes back from Settings (user may have granted there)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active' && !permission?.granted) {
          requestPermission();
        }
      },
    );
    return () => subscription.remove();
  }, [requestPermission, permission?.granted]);

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
