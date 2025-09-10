import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/QuizResult.css';

interface QuizResultData {
  cityName: string;
  questions: any[];
  results: any[];
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

interface QuizResultProps {
  cityName: string;
  score: number;
  total: number;
  answers: string[];
  correctAnswers: string[];
  questionIds: number[];
  onRetry: () => void;
  onBack: () => void;
  onViewStats: () => void;
}

const QuizResult: React.FC<QuizResultProps> = ({
  cityName: propCityName,
  score,
  total,
  answers,
  correctAnswers,
  questionIds,
  onRetry,
  onBack,
  onViewStats
}) => {
  const { cityName: paramCityName } = useParams<{ cityName: string }>();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState<QuizResultData | null>(null);
  const [loading, setLoading] = useState(true);

  // 将URL参数中的英文标识转换为中文城市名称
  const getCityNameFromParam = (param: string) => {
    const cityMapping: { [key: string]: string } = {
      'fuzhou': '福州候官文化',
      'quanzhou': '泉州海丝文化',
      'nanping': '南平朱子文化',
      'longyan': '龙岩红色文化',
      'putian': '莆田妈祖文化'
    };
    return cityMapping[param] || param;
  };

  // 从localStorage加载数据
  useEffect(() => {
    const loadQuizResult = () => {
      try {
        const storedData = localStorage.getItem('quizResult');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setQuizData(parsedData);
        } else {
          // 如果没有存储的数据，使用默认值
          setQuizData({
            cityName: propCityName || (paramCityName ? getCityNameFromParam(paramCityName) : ''),
            questions: [],
            results: [],
            score: score || 0,
            total: total || 0,
            percentage: total > 0 ? Math.round((score / total) * 100) : 0,
            completedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('加载答题结果失败:', error);
        setQuizData({
          cityName: propCityName || (paramCityName ? getCityNameFromParam(paramCityName) : ''),
          questions: [],
          results: [],
          score: 0,
          total: 0,
          percentage: 0,
          completedAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuizResult();
  }, [paramCityName, propCityName, score, total]);

  const handleRetry = () => {
    navigate(`/quiz/${paramCityName}`);
  };

  const handleBack = () => {
    navigate('/quiz');
  };

  const handleViewStats = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="quiz-result-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>正在加载结果...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="quiz-result-container">
        <div className="error">
          <h3>加载失败</h3>
          <p>无法加载答题结果</p>
          <button onClick={handleBack} className="back-btn">返回</button>
        </div>
      </div>
    );
  }

  const { cityName, score: finalScore, total: totalQuestions, percentage } = quizData;

  const getGradeText = () => {
    if (percentage >= 90) return '优秀';
    if (percentage >= 80) return '良好';
    if (percentage >= 70) return '中等';
    if (percentage >= 60) return '及格';
    return '不及格';
  };

  const getGradeColor = () => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 80) return '#8BC34A';
    if (percentage >= 70) return '#FFC107';
    if (percentage >= 60) return '#FF9800';
    return '#f44336';
  };

  return (
    <div className="quiz-result-container">
      {/* 背景图片 */}
      <div className="quiz-background">
        <img
          src="/static/image/index.png"
          alt="背景图片"
          className="quiz-result-background-img"
        />
      </div>

      {/* 内容容器 */}
      <div className="quiz-result-content">
        {/* 头部区域 */}
        <div className="result-header">
          <button onClick={onBack} className="back-btn">← 返回</button>
          <h1>{cityName}知识问答</h1>
          <div className="result-badge">
            <span className="grade-text" style={{ color: getGradeColor() }}>
              {getGradeText()}
            </span>
          </div>
        </div>

        {/* 成绩概览 */}
        <div className="score-overview">
          <div className="score-circle">
            <div className="score-number">{percentage}</div>
            <div className="score-unit">%</div>
          </div>
          <div className="score-details">
            <h3>答题成绩</h3>
            <p className="score-text">
              {finalScore} / {totalQuestions} 题正确
            </p>
          </div>
        </div>

        {/* 详细分析 */}
        <div className="result-analysis">
          <h3>详细分析</h3>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{finalScore}</div>
                <div className="stat-label">答对</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <div className="stat-number">{totalQuestions - finalScore}</div>
                <div className="stat-label">答错</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">{percentage}%</div>
                <div className="stat-label">正确率</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-number">{totalQuestions}</div>
                <div className="stat-label">总题数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="result-actions">
          <button onClick={onRetry} className="action-btn">
            🔄 重新答题
          </button>
          <button onClick={handleBack} className="action-btn">
            🎯 回到互动答题页面
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
