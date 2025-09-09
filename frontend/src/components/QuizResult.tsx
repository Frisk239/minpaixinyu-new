import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/QuizResult.css';

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

  // 将URL参数中的英文标识转换为中文城市名称
  const getCityNameFromParam = (param: string) => {
    const cityMapping: { [key: string]: string } = {
      'fuzhou': '福州市',
      'quanzhou': '泉州市',
      'nanping': '南平市',
      'longyan': '龙岩市',
      'putian': '莆田市'
    };
    return cityMapping[param] || param;
  };

  // 使用props中的cityName或URL参数中的cityName
  const currentCityName = propCityName || (paramCityName ? getCityNameFromParam(paramCityName) : '');

  const handleRetry = () => {
    navigate(`/quiz/${paramCityName}`);
  };

  const handleBack = () => {
    navigate('/quiz');
  };

  const handleViewStats = () => {
    navigate('/home'); // 可以导航到统计页面
  };
  const percentage = Math.round((score / total) * 100);
  const isPassed = percentage >= 60;

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

  const getEncouragementText = () => {
    if (percentage >= 90) return '太棒了！你对这个城市的了解非常深入！';
    if (percentage >= 80) return '很好！你对这个城市有很好的了解！';
    if (percentage >= 70) return '不错！继续努力，你会了解得更多！';
    if (percentage >= 60) return '及格了！多多探索这个城市吧！';
    return '继续加油！多了解这个城市的历史文化！';
  };

  return (
    <div className="quiz-result-container">
      {/* 头部区域 */}
      <div className="result-header">
        <button onClick={onBack} className="back-btn">← 返回</button>
        <h1>{currentCityName}知识问答</h1>
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
            {score} / {total} 题正确
          </p>
          <p className="encouragement">
            {getEncouragementText()}
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
              <div className="stat-number">{score}</div>
              <div className="stat-label">正确答案</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-number">{total - score}</div>
              <div className="stat-label">错误答案</div>
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
              <div className="stat-number">{total}</div>
              <div className="stat-label">总题目数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 题目回顾 */}
      <div className="question-review">
        <h3>题目回顾</h3>
        <div className="review-list">
          {answers.map((answer, index) => {
            const isCorrect = answer === correctAnswers[index];
            return (
              <div key={index} className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="question-number">第 {index + 1} 题</div>
                <div className="answer-status">
                  {isCorrect ? (
                    <span className="status-correct">✓ 正确</span>
                  ) : (
                    <span className="status-incorrect">✗ 错误</span>
                  )}
                </div>
                <div className="answer-detail">
                  你的答案：{answer || '未作答'} | 正确答案：{correctAnswers[index]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 成就徽章 */}
      {isPassed && (
        <div className="achievement">
          <div className="achievement-icon">🏆</div>
          <h4>恭喜通关！</h4>
          <p>你已经成功解锁了{currentCityName}的探索权限！</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="result-actions">
        <button onClick={onRetry} className="action-btn retry-btn">
          🔄 重新答题
        </button>
        <button onClick={onViewStats} className="action-btn stats-btn">
          📊 查看统计
        </button>
        <button onClick={onBack} className="action-btn back-btn">
          🏠 返回首页
        </button>
      </div>

      {/* 鼓励语 */}
      <div className="encouragement-section">
        <div className="encouragement-icon">💡</div>
        <div className="encouragement-text">
          <h4>学习建议</h4>
          <p>
            {percentage >= 80
              ? "你对这个城市的了解已经很全面了！可以尝试探索其他城市，或者深入了解这个城市的更多细节。"
              : "建议你多多探索这个城市的文化景点和历史遗迹，这样可以帮助你更好地理解相关知识。"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
