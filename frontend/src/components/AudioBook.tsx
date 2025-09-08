import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AudioBook.css';

const AudioBook: React.FC = () => {
  const navigate = useNavigate();

  const handleImageClick = (imageIndex: number) => {
    navigate(`/pdf-reader/${imageIndex}`);
  };

  return (
    <div className="audio-book-container">
      {/* 背景图片 */}
      <div className="audio-book-background">
        <img
          src="http://localhost:5000/static/image/index.png"
          alt="有声读物背景"
          className="background-img"
        />
      </div>

      {/* 内容区域 */}
      <div className="audio-book-content">
        <div className="audio-book-grid">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div
              key={index}
              className="passage-card"
              onClick={() => handleImageClick(index)}
            >
              <img
                src={`http://localhost:5000/static/image/passage${index}.png`}
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
      </div>
    </div>
  );
};

export default AudioBook;
