import React, { useState, useEffect } from 'react';
import '../styles/ImagePlayer.css';

interface ImagePlayerProps {
  imageUrl: string;
  onClose: () => void;
}

const ImagePlayer: React.FC<ImagePlayerProps> = ({
  imageUrl,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div className="image-player-overlay">
      {/* 关闭按钮 */}
      <button className="image-player-close" onClick={onClose} aria-label="关闭图片播放器">
        ×
      </button>

      {/* 图片显示区域 */}
      <div className="image-player-content">
        <div className="image-player-image-container">
          {loading && !error && (
            <div className="image-player-loading">
              <div className="loading-spinner"></div>
            </div>
          )}

          {error ? (
            <div className="image-player-error">
              <p>图片加载失败</p>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="图片"
              className={`image-player-image ${loading ? 'loading' : ''}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePlayer;