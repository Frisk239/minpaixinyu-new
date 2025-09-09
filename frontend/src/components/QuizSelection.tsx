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
      name: '福州市',
      description: '历史文化名城，拥有三坊七巷等著名景点',
      image: 'http://localhost:5000/static/image/fuzhou.PNG',
      questionCount: 20
    },
    {
      name: '泉州市',
      description: '海上丝绸之路起点，世界文化遗产',
      image: 'http://localhost:5000/static/image/quanzhou.PNG',
      questionCount: 20
    },
    {
      name: '南平市',
      description: '武夷山所在地，生态旅游胜地',
      image: 'http://localhost:5000/static/image/nanping.PNG',
      questionCount: 20
    },
    {
      name: '龙岩市',
      description: '客家文化发源地，古田会议旧址',
      image: 'http://localhost:5000/static/image/longyan.PNG',
      questionCount: 20
    },
    {
      name: '莆田市',
      description: '妈祖文化发源地，莆仙戏之乡',
      image: 'http://localhost:5000/static/image/putian.PNG',
      questionCount: 20
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
      '福州市': 'fuzhou',
      '泉州市': 'quanzhou',
      '南平市': 'nanping',
      '龙岩市': 'longyan',
      '莆田市': 'putian'
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
      {/* 头部 */}
      <div className="selection-header">
        <button onClick={handleBack} className="back-btn">← 返回首页</button>
        <h1>选择答题城市</h1>
        <p>请选择您想要测试的城市，每个城市都有20道精选题目</p>
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
                  约10分钟
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

      {/* 答题说明 */}
      <div className="quiz-instructions">
        <h3>答题说明</h3>
        <div className="instructions-grid">
          <div className="instruction-item">
            <div className="instruction-icon">🎯</div>
            <div className="instruction-content">
              <h4>题目类型</h4>
              <p>单选题形式，每个题目4个选项</p>
            </div>
          </div>

          <div className="instruction-item">
            <div className="instruction-icon">📊</div>
            <div className="instruction-content">
              <h4>评分标准</h4>
              <p>60分及格，80分良好，90分优秀</p>
            </div>
          </div>

          <div className="instruction-item">
            <div className="instruction-icon">🔄</div>
            <div className="instruction-content">
              <h4>答题机会</h4>
              <p>可多次答题，每次都有新的题目顺序</p>
            </div>
          </div>

          <div className="instruction-item">
            <div className="instruction-icon">🏆</div>
            <div className="instruction-content">
              <h4>成就系统</h4>
              <p>答题通过后解锁城市探索权限</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSelection;
