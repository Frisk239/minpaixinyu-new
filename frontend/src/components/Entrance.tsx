import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Entrance.css';

const Entrance: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const height = rect.height;

    // 如果点击的是下半部分，进入登录页面
    if (clickY > height / 2) {
      navigate('/login');
    }
  };

  return (
    <div className="entrance-container" onClick={handleClick}>
      <div className="entrance-image fade-in">
        <img
          src="http://localhost:5000/static/image/entrance.png"
          alt="进入页面"
          className="entrance-img"
        />
      </div>

    </div>
  );
};

export default Entrance;
