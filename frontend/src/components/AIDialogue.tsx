import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useResponsiveImage } from '../utils/useResponsiveImage';
import '../styles/AIDialogue.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIDialogue: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const backgroundImage = useResponsiveImage('index');

  // 常见问题
  const commonQuestions = [
    "福州的历史文化有哪些特色？",
    "泉州海上丝绸之路的故事",
    "妈祖文化的起源和发展",
    "朱子故里有哪些文化遗产？",
    "龙岩的红色历史文化",
    "福建茶文化介绍",
    "福建传统建筑特色",
    "闽剧的发展历程"
  ];

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `时代之问，闽派来答！✨

Hello～ 我是你们的闽派文化小伙伴「闽仔」！🔥

我超懂咱们大美福建的闽派文化！想知道福州侯官多悠久、泉州海丝多传奇？还是妈祖故事、朱子故里、龙岩红色历史？尽管问我，包你满意！`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || isLoading) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai-chat', {
        message: messageToSend
      });

      // 添加AI回复
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI对话失败:', error);

      // 添加错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我现在有点小问题，请稍后再试试吧！😅',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-dialogue-container">
      {/* 背景图片 */}
      <div className="ai-background">
        <img
          src={backgroundImage}
          alt="AI对话背景"
          className="ai-background-img"
        />
      </div>

      {/* AI 虚拟形象 */}
      <div className="ai-avatar-section">
        <div className="ai-avatar">
          <img
            src="/static/image/cartoon_charactor.png"
            alt="闽仔 - 闽派文化小伙伴"
            className="avatar-image"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'avatar-fallback';
              fallback.textContent = '🤖';
              target.parentNode?.appendChild(fallback);
            }}
          />
        </div>
        <div className="ai-info">
          <h2>闽仔</h2>
          <p>闽派文化小伙伴</p>
        </div>
      </div>

      {/* 对话区域 */}
      <div className="chat-section">
        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-content">
                {message.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant-message loading">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>闽仔正在思考中...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 常见问题 */}
        {messages.length === 1 && (
          <div className="common-questions">
            <h3>常见问题</h3>
            <div className="questions-grid">
              {commonQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="question-btn"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="input-section">
          <div className="input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="问问闽仔关于闽派文化的问题吧..."
              className="message-input"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDialogue;
