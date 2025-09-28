import React, { useState } from 'react';
import { useResponsiveImage } from '../utils/useResponsiveImage';
import '../styles/GameSettings.css';

interface DifficultyInfo {
  id: 'easy' | 'medium' | 'hard';
  name: string;
  description: string;
  aiFeatures: string[];
  estimatedTime: string;
  color: string;
}

interface GameSettingsProps {
  onStartGame: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({ onStartGame }) => {
  const backgroundImage = useResponsiveImage('index');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const difficulties: DifficultyInfo[] = [
    {
      id: 'easy',
      name: '简单模式',
      description: '适合新手玩家，AI响应快速，策略简单',
      aiFeatures: [
        '⚡ 快速响应 (0.1-0.3秒)',
        '🎯 基础出牌策略',
        '😊 偶尔失误',
        '🎮 轻松游戏体验'
      ],
      estimatedTime: '0.1-0.3秒',
      color: '#4CAF50'
    },
    {
      id: 'medium',
      name: '中等模式',
      description: '平衡的挑战，AI会进行策略分析',
      aiFeatures: [
        '🧠 策略深度分析',
        '📊 概率计算',
        '⚖️ 适中响应速度',
        '🎯 推荐选择'
      ],
      estimatedTime: '0.3-0.6秒',
      color: '#FF9800'
    },
    {
      id: 'hard',
      name: '困难模式',
      description: '智能AI，深度分析，预测对手行为',
      aiFeatures: [
        '🤖 深度搜索算法',
        '🔮 最优解计算',
        '👁️ 预测对手行为',
        '🏆 挑战资深玩家'
      ],
      estimatedTime: '0.8-1.5秒',
      color: '#f44336'
    }
  ];

  const handleStartGame = () => {
    onStartGame(selectedDifficulty);
  };

  return (
    <div className="game-settings">
      {/* 背景 */}
      <div className="settings-background">
        <img
          src={backgroundImage}
          alt="设置背景"
          className="settings-bg-image"
        />
      </div>

      {/* 主要内容 */}
      <div className="settings-content">
        {/* 头部 */}
        <div className="settings-header">
          <h1>🎴 《一起闽派！》</h1>
          <p>选择AI难度，开始您的卡牌对战之旅</p>
        </div>

        {/* 难度选择 */}
        <div className="difficulty-selection">
          <h2>选择AI难度</h2>
          <div className="difficulty-grid">
            {difficulties.map((difficulty) => (
              <DifficultyCard
                key={difficulty.id}
                difficulty={difficulty}
                selected={selectedDifficulty === difficulty.id}
                onSelect={() => setSelectedDifficulty(difficulty.id)}
              />
            ))}
          </div>
        </div>

        {/* 游戏说明 */}
        <div className="game-info">
          <h3>🎯 游戏规则</h3>
          <div className="rules-grid">
            <div className="rule-item">
              <span className="rule-icon">🎴</span>
              <span className="rule-text">75张文化卡牌，5类文化各15张</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🎯</span>
              <span className="rule-text">相同文化或类型才能出牌</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🗣️</span>
              <span className="rule-text">只剩一张手牌时，必须叫闽派，超时未叫，罚两张手牌</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🏆</span>
              <span className="rule-text">最先清空手牌的玩家获胜</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="settings-actions">
          <button
            onClick={handleStartGame}
            className="start-game-btn"
            style={{ backgroundColor: difficulties.find(d => d.id === selectedDifficulty)?.color }}
          >
            🚀 开始游戏 ({difficulties.find(d => d.id === selectedDifficulty)?.name})
          </button>
        </div>
      </div>
    </div>
  );
};

// 难度卡片组件
interface DifficultyCardProps {
  difficulty: DifficultyInfo;
  selected: boolean;
  onSelect: () => void;
}

const DifficultyCard: React.FC<DifficultyCardProps> = ({
  difficulty,
  selected,
  onSelect
}) => {
  return (
    <div
      className={`difficulty-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      style={{
        borderColor: selected ? difficulty.color : 'rgba(255, 255, 255, 0.2)',
        boxShadow: selected ? `0 0 30px ${difficulty.color}40` : undefined
      }}
    >
      {/* 卡片头部 */}
      <div className="card-header">
        <h3 style={{ color: difficulty.color }}>{difficulty.name}</h3>
        <span className="time-badge">{difficulty.estimatedTime}</span>
      </div>

      {/* 描述 */}
      <p className="card-description">{difficulty.description}</p>

      {/* AI特点 */}
      <div className="ai-features">
        <h4>🤖 AI特点：</h4>
        <ul>
          {difficulty.aiFeatures.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      {/* 选择指示器 */}
      {selected && (
        <div className="selected-indicator" style={{ backgroundColor: difficulty.color }}>
          <span>✓ 已选择</span>
        </div>
      )}

      {/* 悬停效果 */}
      <div className="card-hover-effect" style={{ backgroundColor: difficulty.color }}></div>
    </div>
  );
};

export default GameSettings;
