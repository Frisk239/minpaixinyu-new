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

interface QuizResult {
  questionId: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  questionText: string;
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
      'fuzhou': '福州候官文化',
      'quanzhou': '泉州海丝文化',
      'nanping': '南平朱子文化',
      'longyan': '龙岩红色文化',
      'putian': '莆田妈祖文化'
    };
    return cityMapping[param] || param;
  };

  // 使用props中的cityName或URL参数中的cityName
  const currentCityName = propCityName || (paramCityName ? getCityNameFromParam(paramCityName) : '');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
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
      // 使用完整的API URL
      const apiUrl = process.env.NODE_ENV === 'development'
        ? `http://localhost:5000/api/questions/${currentCityName}`
        : `https://frp-say.com:39668/api/questions/${currentCityName}`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`获取题目失败: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const allQuestions = data.questions || [];

      // 从所有题目中随机选择5道
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 5);

      setQuestions(selectedQuestions);
      setAnswers(new Array(selectedQuestions.length).fill(''));
      setQuizResults(new Array(selectedQuestions.length).fill(null));
    } catch (err) {
      console.error('获取题目错误:', err);
      setError(err instanceof Error ? err.message : '获取题目失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证答案
  const verifyAnswer = async (answer: string) => {
    if (!questions[currentQuestionIndex]) return;

    try {
      setVerifying(true);
      const apiUrl = process.env.NODE_ENV === 'development'
        ? `http://localhost:5000/api/questions/${currentCityName}/${questions[currentQuestionIndex].id}/verify`
        : `https://frp-say.com:39668/api/questions/${currentCityName}/${questions[currentQuestionIndex].id}/verify`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ answer })
      });

      if (!response.ok) {
        throw new Error(`验证失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const correct = result.is_correct;

      // 更新答案数组
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = answer;
      setAnswers(newAnswers);

      // 更新结果数组
      const newResults = [...quizResults];
      newResults[currentQuestionIndex] = {
        questionId: questions[currentQuestionIndex].id,
        userAnswer: answer,
        correctAnswer: result.correct_answer,
        isCorrect: correct,
        questionText: questions[currentQuestionIndex].question_text
      };
      setQuizResults(newResults);

      // 显示反馈
      setIsCorrect(correct);
      setFeedbackMessage(correct ? '✓ 回答正确！' : `✗ 回答错误，正确答案是：${result.correct_answer}`);
      setShowFeedback(true);

      // 2秒后自动隐藏反馈并进入下一题
      setTimeout(() => {
        setShowFeedback(false);
        handleNextQuestion();
      }, 2000);

    } catch (err) {
      console.error('验证答案错误:', err);
      setError(err instanceof Error ? err.message : '验证答案失败');
    } finally {
      setVerifying(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (verifying || showFeedback) return; // 防止重复点击

    setSelectedAnswer(answer);
    verifyAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1] || '');
    } else {
      // 所有题目答完，保存结果并跳转
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || '');
    }
  };

  const finishQuiz = () => {
    // 计算最终得分
    const correctCount = quizResults.filter(result => result?.isCorrect).length;
    const totalQuestions = questions.length;

    // 保存到localStorage
    const quizData = {
      cityName: currentCityName,
      questions: questions,
      results: quizResults,
      score: correctCount,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
      completedAt: new Date().toISOString()
    };

    localStorage.setItem('quizResult', JSON.stringify(quizData));

    // 导航到结果页面
    navigate(`/quiz-result/${paramCityName}`);
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
      {/* 背景图片 */}
      <div className="quiz-background">
        <img
          src="http://localhost:5000/static/image/index.png"
          alt="背景图片"
          className="quiz-background-img"
        />
      </div>

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
                showFeedback && key === currentQuestion.correct_answer ? 'correct' : ''
              } ${
                showFeedback && selectedAnswer === key && key !== currentQuestion.correct_answer ? 'incorrect' : ''
              }`}
              onClick={() => handleAnswerSelect(key)}
              disabled={verifying || showFeedback}
            >
              <span className="option-key">{key}.</span>
              <span className="option-text">{value}</span>
            </button>
          ))}
        </div>

        {/* 即时反馈 */}
        {showFeedback && (
          <div className={`feedback-message ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              {isCorrect ? '✅' : '❌'}
            </div>
            <div className="feedback-text">
              {feedbackMessage}
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {verifying && (
          <div className="verifying">
            <div className="spinner small"></div>
            <p>正在验证答案...</p>
          </div>
        )}
      </div>

      {/* 导航按钮 */}
      <div className="quiz-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || verifying || showFeedback}
          className="nav-btn"
        >
          上一题
        </button>

        {!isLastQuestion ? (
          <button
            onClick={handleNextQuestion}
            disabled={!isAnswered || verifying || showFeedback}
            className="nav-btn primary"
          >
            下一题
          </button>
        ) : (
          <button
            onClick={finishQuiz}
            disabled={getAnsweredCount() < questions.length || verifying || showFeedback}
            className="nav-btn primary submit-btn"
          >
            查看结果
          </button>
        )}
      </div>

      {/* 题目导航点 */}
      <div className="question-nav">
        {questions.map((_, index) => {
          const result = quizResults[index];
          return (
            <button
              key={index}
              className={`question-dot ${
                index === currentQuestionIndex ? 'current' : ''
              } ${
                result ? (result.isCorrect ? 'correct' : 'incorrect') : ''
              }`}
              onClick={() => {
                if (!verifying && !showFeedback) {
                  setCurrentQuestionIndex(index);
                  setSelectedAnswer(answers[index] || '');
                }
              }}
              disabled={verifying || showFeedback}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Quiz;
