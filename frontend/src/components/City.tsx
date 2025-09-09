import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/City.css';

interface CityExploration {
  id: number;
  user_id: number;
  city_name: string;
  is_explored: boolean;
  explored_at: string | null;
  created_at: string;
}

const City: React.FC = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const navigate = useNavigate();
  const [cityExploration, setCityExploration] = useState<CityExploration | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 特殊城市列表
  const specialCities = ['福州市', '泉州市', '莆田市', '南平市', '龙岩市'];

  useEffect(() => {
    if (!cityName || !specialCities.includes(decodeURIComponent(cityName))) {
      navigate('/home');
      return;
    }

    fetchCityData();
  }, [cityName, navigate]);

  const fetchCityData = async () => {
    try {
      const decodedCityName = decodeURIComponent(cityName!);
      console.log('正在获取城市数据:', decodedCityName);
      const response = await axios.get(`http://localhost:5000/api/city-explorations/${encodeURIComponent(decodedCityName)}`);
      console.log('城市数据响应:', response.data);
      setCityExploration(response.data.exploration);
    } catch (error: any) {
      console.error('获取城市数据失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsExplored = async () => {
    if (!cityExploration || cityExploration.is_explored) return;

    setUpdating(true);
    try {
      const decodedCityName = decodeURIComponent(cityName!);
      const response = await axios.post(`http://localhost:5000/api/city-explorations/${encodeURIComponent(decodedCityName)}/explore`);
      setCityExploration(response.data.exploration);

      // 显示解锁动画
      showUnlockAnimation();
    } catch (error) {
      console.error('标记探索失败:', error);
      alert('标记探索失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  const showUnlockAnimation = () => {
    const animationContainer = document.createElement('div');
    animationContainer.className = 'unlock-animation';
    animationContainer.innerHTML = `
      <div class="unlock-content">
        <img src="http://localhost:5000/static/image/unloc.gif" alt="解锁动画" class="unlock-gif" />
        <div class="unlock-text">城市已解锁！</div>
      </div>
    `;

    document.body.appendChild(animationContainer);

    // 3秒后自动移除动画
    setTimeout(() => {
      if (animationContainer.parentNode) {
        animationContainer.parentNode.removeChild(animationContainer);
      }
    }, 3000);
  };

  const goBackToHome = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="city-loading">
        <div className="loading-spinner"></div>
        <p>正在加载城市信息...</p>
      </div>
    );
  }

  if (!cityExploration) {
    return (
      <div className="city-error">
        <h2>城市信息加载失败</h2>
        <button onClick={goBackToHome} className="back-btn">
          返回文化云游
        </button>
      </div>
    );
  }

  const decodedCityName = decodeURIComponent(cityName!);

  return (
    <div className="city-container">
      <div className="city-header">
        <h1>{decodedCityName}</h1>
        <div className="city-status">
          <span className={`status-badge ${cityExploration.is_explored ? 'explored' : 'unexplored'}`}>
            {cityExploration.is_explored ? '已探索' : '未探索'}
          </span>
        </div>
      </div>

      <div className="city-content">
        <div className="city-info">
          <h2>城市介绍</h2>
          <p>这里是 {decodedCityName} 的介绍页面。</p>
          <p>您可以在这里探索城市的文化特色和历史故事。</p>

          {cityExploration.is_explored && (
            <div className="explored-info">
              <h3>探索完成时间</h3>
              <p>{new Date(cityExploration.explored_at!).toLocaleString('zh-CN')}</p>
            </div>
          )}
        </div>

        <div className="city-actions">
          {/* 调试信息 */}
          <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
            调试信息: is_explored = {cityExploration.is_explored ? 'true' : 'false'}
          </div>

          {!cityExploration.is_explored && (
            <button
              onClick={markAsExplored}
              disabled={updating}
              className="explore-btn"
            >
              {updating ? '标记中...' : '标记为已探索'}
            </button>
          )}

          {cityExploration.is_explored && (
            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#28a745' }}>
              ✅ 此城市已探索完成！
            </div>
          )}

          <button
            onClick={goBackToHome}
            className="back-btn"
          >
            返回文化云游
          </button>
        </div>
      </div>
    </div>
  );
};

export default City;
