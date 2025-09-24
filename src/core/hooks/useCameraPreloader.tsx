import { useEffect, useState } from 'react';

/**
 * Hook để quản lý việc preload camera
 * Giúp tăng tốc độ khởi động camera khi cần sử dụng
 */
export const useCameraPreloader = () => {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [shouldPreload, setShouldPreload] = useState(false);

  useEffect(() => {
    // Preload camera sau một khoảng thời gian ngắn
    // để không ảnh hưởng đến performance ban đầu của app
    const timer = setTimeout(() => {
      setShouldPreload(true);
    }, 2000); // Preload sau 2 giây

    return () => clearTimeout(timer);
  }, []);

  const markAsPreloaded = () => {
    setIsPreloaded(true);
  };

  return {
    isPreloaded,
    shouldPreload,
    markAsPreloaded,
  };
};

export default useCameraPreloader;
