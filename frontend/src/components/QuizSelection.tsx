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
      description: '福州传统文化的重要载体，展现闽都文化的独特魅力',
      image: 'http://localhost:5000/static/image/fuzhou.PNG',
      questionCount: 5
    },
    {
      name: '泉州海丝文化',
      description: '古代海上丝绸之路的重要港口，多元文化交融之地',
      image: 'http://localhost:5000/static/image/quanzhou.PNG',
      questionCount: 5
    },
    {
      name: '南平朱子文化',
      description: '理学大师朱熹的故乡，儒家文化的重要传承地',
      image: 'http://localhost:5000/static/image/nanping.PNG',
      questionCount: 5
    },
    {
      name: '龙岩红色文化',
      description: '中国革命的重要策源地，红色文化的精神家园',
      image: 'http://localhost:5000/static/image/longyan.PNG',
      questionCount: 5
    },
    {
      name: '莆田妈祖文化',
      description: '妈祖文化的发源地，海洋文化的精神象征',
      image: 'http://localhost:5000/static/image/putian.PNG',
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
          src="http://localhost:5000/static/image/index.png"
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
                  target.src = 'http://localhost:5000/static/image/logo.png';
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
