import { useState, useEffect } from 'react';

/**
 * 自定义hook：根据设备类型返回合适的图片路径
 * @param baseImageName 基础图片名称（如 'index' 或 'entrance'）
 * @returns 适合当前设备的图片路径
 */
export const useResponsiveImage = (baseImageName: string): string => {
  const [imagePath, setImagePath] = useState(`/static/image/${baseImageName}.png`);

  useEffect(() => {
    const checkDevice = () => {
      // 检查是否为移动设备（屏幕宽度 <= 768px）
      const isMobile = window.innerWidth <= 768;
      const newImagePath = isMobile
        ? `/static/image/${baseImageName}-mobile.png`
        : `/static/image/${baseImageName}.png`;

      setImagePath(newImagePath);
    };

    // 初始检查
    checkDevice();

    // 监听窗口大小变化
    window.addEventListener('resize', checkDevice);

    // 清理事件监听器
    return () => window.removeEventListener('resize', checkDevice);
  }, [baseImageName]);

  return imagePath;
};
