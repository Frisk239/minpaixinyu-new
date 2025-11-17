import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsiveImage } from '../utils/useResponsiveImage';
import '../styles/AudioBook.css';

const AudioBook: React.FC = () => {
  const navigate = useNavigate();
  const backgroundImage = useResponsiveImage('index');

  const handleImageClick = (imageIndex: number) => {
    navigate(`/pdf-reader/${imageIndex}`);
  };

  const handleCityPictureBookClick = (cityName: string) => {
    navigate(`/city-picture-book/${cityName}`);
  };

  // 城市列表
  const cities = [
    { name: '福州', code: 'fuzhou' },
    { name: '泉州', code: 'quanzhou' },
    { name: '南平', code: 'nanping' },
    { name: '龙岩', code: 'longyan' },
    { name: '莆田', code: 'putian' }
  ];

  return (
    <div className="audio-book-container">
      {/* 背景图片 */}
      <div className="audio-book-background">
        <img
          src={backgroundImage}
          alt="有声读物背景"
          className="background-img"
        />
      </div>

      {/* 内容区域 */}
      <div className="audio-book-content">
        {/* 学习日记标题 */}
        <div className="category-title">《学习日记》</div>

        <div className="audio-book-grid">
          {/* 原始的6个有声读物卡片 */}
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div
              key={index}
              className="passage-card"
              onClick={() => handleImageClick(index)}
            >
              <img
                src={`/static/image/passage${index}.png`}
                alt={`有声读物 ${index}`}
                className="passage-img"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'passage-fallback';
                  fallback.textContent = `有声读物 ${index}`;
                  target.parentNode?.appendChild(fallback);
                }}
              />
            </div>
          ))}

        </div>

        {/* 文化声芽标题 */}
        <div className="category-title category-title-culture">《文化声芽》</div>

        {/* 城市绘本卡片网格 */}
        <div className="audio-book-grid city-grid">
          {cities.map((city) => (
            <div
              key={city.code}
              className="passage-card"
              onClick={() => handleCityPictureBookClick(city.code)}
            >
              <img
                src={`/static/${city.code}/${city.code}-picture-book.png`}
                alt={`${city.name}绘本`}
                className="passage-img"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'passage-fallback';
                  fallback.textContent = `${city.name}绘本`;
                  target.parentNode?.appendChild(fallback);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AudioBook;
