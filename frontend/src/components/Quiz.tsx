import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Quiz.css';

interface Question {
  id: number;
  city_name: string;
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
}

interface QuizProps {
  cityName: string;
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
}

const Quiz: React.FC<QuizProps> = ({ cityName: propCityName, onComplete, onBack }) => {
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

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 获取题目数据
  useEffect(() => {
    if (currentCityName) {
      fetchQuestions();
    }
  }, [currentCityName]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions/${currentCityName}`);
      if (!response.ok) {
        throw new Error('获取题目失败');
      }
      const data = await response.json();
      setQuestions(data.questions || []);
      setAnswers(new Array(data.questions?.length || 0).fill(''));
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取题目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1] || '');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || '');
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityName: currentCityName,
          answers,
          questionIds: questions.map(q => q.id)
        })
      });

      if (!response.ok) {
        throw new Error('提交答案失败');
      }

      const result = await response.json();
      setShowResult(true);

      // 导航到结果页面
      setTimeout(() => {
        navigate(`/quiz-result/${currentCityName}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : '提交答案失败');
    }
  };

  const calculateProgress = () => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return answers.filter(answer => answer !== '').length;
  };

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>正在加载题目...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-container">
        <div className="error">
          <h3>出错了</h3>
          <p>{error}</p>
          <button onClick={onBack} className="back-btn">返回</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="no-questions">
          <h3>暂无题目</h3>
          <p>该城市的题目还未准备好，请稍后再试。</p>
          <button onClick={onBack} className="back-btn">返回</button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = answers[currentQuestionIndex] !== '';
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="quiz-container">
      {/* 头部信息 */}
      <div className="quiz-header">
        <button onClick={onBack} className="back-btn">← 返回</button>
        <h2>{currentCityName}知识问答</h2>
        <div className="quiz-info">
          <span>题目 {currentQuestionIndex + 1} / {questions.length}</span>
          <span>已答 {getAnsweredCount()} / {questions.length}</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${calculateProgress()}%` }}
        ></div>
      </div>

      {/* 题目内容 */}
      <div className="question-card">
        <div className="question-header">
          <h3>第 {currentQuestionIndex + 1} 题</h3>
          {isAnswered && (
            <span className="answered-mark">✓ 已答</span>
          )}
        </div>

        <div className="question-text">
          {currentQuestion.question_text}
        </div>

        <div className="options">
          {Object.entries(currentQuestion.options).map(([key, value]) => (
            <button
              key={key}
              className={`option-btn ${
                selectedAnswer === key ? 'selected' : ''
              } ${
                showResult && key === currentQuestion.correct_answer ? 'correct' : ''
              } ${
                showResult && selectedAnswer === key && key !== currentQuestion.correct_answer ? 'incorrect' : ''
              }`}
              onClick={() => handleAnswerSelect(key)}
              disabled={showResult}
            >
              <span className="option-key">{key}.</span>
              <span className="option-text">{value}</span>
            </button>
          ))}
        </div>

        {/* 答案解析（提交后显示） */}
        {showResult && (
          <div className="answer-explanation">
            <h4>正确答案：{currentQuestion.correct_answer}</h4>
            <p>你的选择：{selectedAnswer || '未选择'}</p>
          </div>
        )}
      </div>

      {/* 导航按钮 */}
      <div className="quiz-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="nav-btn"
        >
          上一题
        </button>

        {!isLastQuestion ? (
          <button
            onClick={handleNext}
            className="nav-btn primary"
          >
            下一题
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={getAnsweredCount() === 0}
            className="nav-btn primary submit-btn"
          >
            提交答案
          </button>
        )}
      </div>

      {/* 题目导航点 */}
      <div className="question-nav">
        {questions.map((_, index) => (
          <button
            key={index}
            className={`question-dot ${
              index === currentQuestionIndex ? 'current' : ''
            } ${
              answers[index] !== '' ? 'answered' : ''
            }`}
            onClick={() => {
              setCurrentQuestionIndex(index);
              setSelectedAnswer(answers[index] || '');
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* 结果显示 */}
      {showResult && (
        <div className="quiz-result">
          <h3>答题完成！</h3>
          <p>正在计算成绩...</p>
        </div>
      )}
    </div>
  );
};

export default Quiz;
