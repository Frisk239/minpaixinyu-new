import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ImagePlayer from './ImagePlayer';
import '../styles/ImageCarousel.css';
import '../styles/ImagePlayer.css';

interface ImageCarouselProps {
  cityKey: string;
  cityName: string;
  className?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  cityKey,
  cityName,
  className = ''
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  // 图片路径
  const imagePaths = [
    `/static/${cityKey}/${cityKey}.png`,
    `/static/${cityKey}/${cityKey}1.png`
  ];

  useEffect(() => {
    // 预加载图片并检查是否都存在
    const preloadImages = async () => {
      try {
        const imagePromises = imagePaths.map(path => {
          return new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(path);
            img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
            img.src = path;
          });
        });

        const loadedImages = await Promise.allSettled(imagePromises);
        const validImages = loadedImages
          .filter((result): result is PromiseFulfilledResult<string> =>
            result.status === 'fulfilled')
          .map(result => result.value);

        setImages(validImages);
        setError(validImages.length === 0);
      } catch (err) {
        console.error('预加载图片失败:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    preloadImages();
  }, [cityKey]);

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleImageClick = (imageUrl: string) => {
    setCurrentImageUrl(imageUrl);
    setShowPlayer(true);
  };

  const closePlayer = () => {
    setShowPlayer(false);
  };

  // 键盘导航支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (images.length <= 1) return;

      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  // 自动轮播（可选，每5秒切换一次）
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (loading) {
    return (
      <div className={`image-carousel-loading ${className}`}>
        <div className="carousel-loading-spinner"></div>
        <p>正在加载图片...</p>
      </div>
    );
  }

  if (error || images.length === 0) {
    return (
      <div className={`image-carousel-error ${className}`}>
        <img
          src="/static/image/index.png"
          alt={`${cityName}文化地点分布`}
          className="carousel-fallback-image"
        />
        <p>图片加载失败</p>
      </div>
    );
  }

  // 如果只有一张图片，不显示轮播控件
  if (images.length === 1) {
    return (
      <div className={`image-carousel single-image ${className}`}>
        <img
          src={images[0]}
          alt={`${cityName}文化地点分布`}
          className="carousel-image"
          onClick={() => handleImageClick(images[0])}
          style={{ cursor: 'pointer' }}
        />

        {/* 图片播放器 */}
        {showPlayer && ReactDOM.createPortal(
          <ImagePlayer
            imageUrl={currentImageUrl}
            onClose={closePlayer}
          />,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className={`image-carousel ${className}`}>
      <div className="carousel-container">
        {/* 主图片显示 */}
        <div className="carousel-image-wrapper">
          <img
            src={images[currentImageIndex]}
            alt={`${cityName}文化地点分布 - 图片 ${currentImageIndex + 1}`}
            className="carousel-image"
            onClick={() => handleImageClick(images[currentImageIndex])}
            style={{ cursor: 'pointer' }}
          />

          {/* 左右切换按钮 */}
          <button
            className="carousel-btn carousel-btn-prev"
            onClick={goToPrevious}
            aria-label="上一张图片"
          >
            ‹
          </button>
          <button
            className="carousel-btn carousel-btn-next"
            onClick={goToNext}
            aria-label="下一张图片"
          >
            ›
          </button>
        </div>

        {/* 指示器 */}
        <div className="carousel-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentImageIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`切换到图片 ${index + 1}`}
            />
          ))}
        </div>

        {/* 图片计数器 */}
        <div className="carousel-counter">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* 图片来源说明 */}
      <div className="carousel-hint">
        <p>图源：福建师范大学地理科学学院、碳中和未来技术学院彭红茹</p>
        <p style={{ fontSize: '12px', marginTop: '5px', opacity: '0.8' }}>点击图片可放大查看</p>
      </div>

      {/* 图片播放器 */}
      {showPlayer && ReactDOM.createPortal(
        <ImagePlayer
          imageUrl={currentImageUrl}
          onClose={closePlayer}
        />,
        document.body
      )}
    </div>
  );
};

export default ImageCarousel;