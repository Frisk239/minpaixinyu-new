import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/QuizSelection.css';

interface CityInfo {
  name: string;
  description: string;
  image: string;
  questionCount: number;
}

const QuizSelection: React.FC = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // 城市信息
  const cityData: CityInfo[] = [
    {
      name: '福州候官文化',
      description: '敢为天下先，开眼看世界。',
      image: '/static/image/fuzhou.PNG',
      questionCount: 5
    },
    {
      name: '泉州海丝文化',
      description: '爱拼才会赢，潮声传五洲。',
      image: '/static/image/quanzhou.PNG',
      questionCount: 5
    },
    {
      name: '南平朱子文化',
      description: '格物致知理，继往开来魂。',
      image: '/static/image/nanping.PNG',
      questionCount: 5
    },
    {
      name: '龙岩红色文化',
      description: '星火可燎原，浩气永长存。',
      image: '/static/image/longyan.PNG',
      questionCount: 5
    },
    {
      name: '莆田妈祖文化',
      description: '大爱通四海，慈光佑五洲。',
      image: '/static/image/putian.PNG',
      questionCount: 5
    }
  ];

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setCities(cityData);
      setLoading(false);
    }, 500);
  }, []);

  const handleCitySelect = (cityName: string) => {
    // 将城市名称转换为对应的英文标识
    const cityMapping: { [key: string]: string } = {
      '福州候官文化': 'fuzhou',
      '泉州海丝文化': 'quanzhou',
      '南平朱子文化': 'nanping',
      '龙岩红色文化': 'longyan',
      '莆田妈祖文化': 'putian'
    };

    const cityKey = cityMapping[cityName] || cityName;
    navigate(`/quiz/${cityKey}`);
  };

  const handleBack = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="quiz-selection-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>正在加载城市信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-selection-container">
      {/* 背景图片 */}
      <div className="quiz-selection-background">
        <img
          src="/static/image/index.png"
          alt="背景图片"
          className="quiz-selection-background-img"
        />
      </div>

      {/* 头部 */}
      <div className="selection-header">
        <button onClick={handleBack} className="back-btn">← 返回首页</button>
        <h1>选择答题城市</h1>
        <p>请选择您想要测试的城市，每个城市随机抽取5道精选题目</p>
      </div>

      {/* 城市选择网格 */}
      <div className="cities-grid">
        {cities.map((city, index) => (
          <div
            key={city.name}
            className="city-card"
            onClick={() => handleCitySelect(city.name)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="city-image-container">
              <img
                src={city.image}
                alt={city.name}
                className="city-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/static/image/logo.png';
                }}
              />
              <div className="city-overlay">
                <div className="city-name">{city.name}</div>
                <div className="question-count">{city.questionCount}题</div>
              </div>
            </div>

            <div className="city-content">
              <h3>{city.name}</h3>
              <p>{city.description}</p>
              <div className="city-stats">
                <span className="stat-item">
                  <span className="stat-icon">📚</span>
                  {city.questionCount}道题目
                </span>
                <span className="stat-item">
                  <span className="stat-icon">⏱️</span>
                  约3分钟
                </span>
              </div>
            </div>

            <div className="city-action">
              <button className="start-quiz-btn">
                开始答题
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};

export default QuizSelection;
