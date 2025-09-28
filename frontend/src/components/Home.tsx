import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Map from './Map';
import { useResponsiveImage } from '../utils/useResponsiveImage';
import '../styles/Home.css';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface HomeProps {
  user: User | null;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const backgroundImage = useResponsiveImage('index');

  return (
    <div className="home-container">
      {/* 背景图片 */}
      <div className="home-background">
        <img
          src={backgroundImage}
          alt="首页背景"
          className="home-background-img"
        />
      </div>

      {/* 内容区域 */}
      <div className="home-content">
        <div className="welcome-section">
          <h1>欢迎来到闽派新语</h1>
          {user && (
            <p className="welcome-user">
              您好，{user.username}！欢迎体验我们的文化学习平台。
            </p>
          )}
        </div>

        {/* 福建地图 */}
        {user && <Map userId={user.id} />}
      </div>
    </div>
  );
};

export default Home;
