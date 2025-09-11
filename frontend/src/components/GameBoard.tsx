import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GameEngine, createGameEngine } from '../utils/gameEngine';
import { Card, GameState } from '../utils/gameTypes';
import { CULTURE_COLORS, CULTURE_NAMES, CARD_TYPE_NAMES } from '../utils/gameTypes';
import GameSettings from './GameSettings';
import '../styles/GameBoard.css';

interface GameBoardProps {
  difficulty?: 'easy' | 'medium' | 'hard';
}

const GameBoard: React.FC<GameBoardProps> = ({ difficulty = 'medium' }) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string>('');
  const [showMessage, setShowMessage] = useState(false);
  const [minpaiCountdown, setMinpaiCountdown] = useState<number | null>(null); // 叫牌倒计时（隐藏）
  const prevGameStateRef = useRef<GameState | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化游戏
  useEffect(() => {
    const engine = createGameEngine({
      aiDifficulty: difficulty,
      enableSound: true
    });

    engine.setStateChangeCallback((newState) => {
      console.log('🎮 前端收到状态变化:');
      console.log('🎯 当前玩家:', newState.currentPlayer);
      console.log('🃏 当前牌:', newState.currentCard?.name || '无', '(ID:', newState.currentCard?.id || '无)');
      console.log('👤 玩家手牌数:', newState.playerHand.length);
      console.log('🤖 AI手牌数:', newState.aiHand.length);
      console.log('🎭 轮次:', newState.roundCount);
      console.log('🏆 游戏阶段:', newState.gamePhase);
      console.log('⏰ 时间戳:', new Date().toLocaleTimeString());

      // 使用ref来跟踪之前的状态，避免闭包问题
      const prevState = prevGameStateRef.current;
      const prevCurrentCard = prevState?.currentCard?.name || '无';
      const newCurrentCard = newState.currentCard?.name || '无';

      if (prevCurrentCard !== newCurrentCard) {
        console.log('🔄 当前牌变化:', prevCurrentCard, '→', newCurrentCard);
      }

      // 检查是否需要启动叫牌倒计时
      if (newState.currentPlayer === 'human' && newState.playerHand.length === 1 && newState.gamePhase === 'playing') {
        console.log('⏰ 玩家只剩一张牌，开始3秒叫牌倒计时');
        startMinpaiCountdown();
      } else {
        // 取消倒计时
        clearMinpaiCountdown();
      }

      // 更新ref
      prevGameStateRef.current = { ...newState };

      console.log('🔄 正在调用setGameState...');
      setGameState(newState);
      console.log('✅ 前端状态已更新 - React状态同步完成');

      // 强制触发React重新渲染
      setTimeout(() => {
        console.log('🔄 强制重新渲染检查...');
        // 强制更新组件
        setGameState(prevState => prevState ? { ...prevState } : null);
        console.log('✅ 强制重新渲染完成\n');
      }, 0);
    });

    engine.setGameEndCallback((winner, finalState) => {
      console.log('🏁 游戏结束 - 胜者:', winner);
      // 取消倒计时
      clearMinpaiCountdown();
      setGameState(finalState);
      showGameMessage(winner === 'human' ? '🎉 恭喜你赢了！' : '😔 AI赢了，下次加油！');
    });

    setGameEngine(engine);
    const initialState = engine.getGameState();
    setGameState(initialState);
    prevGameStateRef.current = initialState; // 初始化ref
    setIsLoading(false);

    return () => {
      engine.destroy();
      clearMinpaiCountdown();
    };
  }, [difficulty]);

  // 显示消息
  const showGameMessage = (msg: string) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  // 出牌处理
  const handlePlayCard = async (cardId: string) => {
    if (!gameEngine) return;

    const result = await gameEngine.playCard(cardId);
    if (!result.success && result.message) {
      showGameMessage(result.message);
    }
  };

  // 叫闽派
  const handleCallMinpai = () => {
    if (!gameEngine) return;

    // 清除倒计时
    clearMinpaiCountdown();

    const result = gameEngine.callMinpai();
    if (!result.success && result.message) {
      showGameMessage(result.message);
    } else if (result.message) {
      showGameMessage(result.message);
    }
  };

  // 重新开始游戏
  const handleRestart = () => {
    if (!gameEngine) return;

    const newState = gameEngine.restartGame();
    setGameState(newState);
    setShowMessage(false);
  };

  // 返回首页
  const handleBack = () => {
    navigate('/home');
  };

  // 开始叫牌倒计时
  const startMinpaiCountdown = () => {
    // 清除之前的倒计时
    clearMinpaiCountdown();

    console.log('⏰ 开始3秒叫牌倒计时');
    setMinpaiCountdown(3);

    countdownRef.current = setInterval(() => {
      setMinpaiCountdown(prev => {
        if (prev === null || prev <= 1) {
          // 倒计时结束，AI处罚玩家
          console.log('⏰ 倒计时结束，AI处罚玩家');
          clearMinpaiCountdown();

          // AI处罚玩家 - 强制处罚
          if (gameEngine) {
            console.log('⚠️ 玩家未在3秒内叫牌，AI自动处罚');

            // 直接调用游戏引擎的处罚方法
            // 这里我们需要一个特殊的方法来处理AI强制处罚
            // 由于游戏引擎中没有直接的强制处罚方法，我们通过模拟叫牌失败来处罚
            const result = gameEngine.callMinpai();
            if (!result.success) {
              // 如果叫牌失败，说明AI举报成功，玩家被罚牌
              showGameMessage('⏰ 时间到！AI举报成功，你被罚牌！');
            }
          }

          return null;
        }
        console.log(`⏰ 倒计时: ${prev - 1}秒`);
        return prev - 1;
      });
    }, 1000);
  };

  // 清除叫牌倒计时
  const clearMinpaiCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setMinpaiCountdown(null);
    console.log('⏰ 叫牌倒计时已清除');
  };

  if (isLoading || !gameState) {
    return (
      <div className="game-loading">
        <div className="loading-spinner"></div>
        <p>正在准备游戏...</p>
      </div>
    );
  }

  const playableCards = gameEngine?.getPlayableCards() || [];
  const canCallMinpai = gameState.playerHand.length === 1 && gameState.currentPlayer === 'human';

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="game-board">
        {/* 背景 */}
        <div className="game-background">
          <img
            src="/static/image/index.png"
            alt="游戏背景"
            className="game-bg-image"
          />
        </div>

        {/* 游戏头部 */}
        <div className="game-header">
          <button onClick={handleBack} className="back-btn">← 返回首页</button>
          <h1>🎴 《一起闽派！》</h1>
          <div className="game-info">
            <span>回合: {gameState.roundCount}</span>
            <span>当前玩家: {gameState.currentPlayer === 'human' ? '你' : 'AI'}</span>
          </div>
        </div>

        {/* 游戏主体 */}
        <div className="game-main">
          {/* AI对手区域 */}
          <div className="ai-area">
            <div className="player-info">
              <h3>🤖 AI对手</h3>
              <span className="card-count">手牌: {gameState.aiHand.length}张</span>
              {gameState.aiCalledMinpai && <span className="minpai-indicator">🗣️ 叫了闽派！</span>}
            </div>
            <div className="ai-hand">
              {Array.from({ length: gameState.aiHand.length }, (_, i) => (
                <div key={i} className="card-back">
                  <div className="card-pattern">🎴</div>
                </div>
              ))}
            </div>
          </div>

          {/* 中央游戏区域 */}
          <div className="game-center">
            {/* 当前牌 */}
            <div className="current-card-area">
              <h3>当前牌</h3>
              {gameState.currentCard && (
                <div className="current-card">
                  <CardDisplay card={gameState.currentCard} isCurrent={true} />
                </div>
              )}
            </div>

            {/* 游戏控制 */}
            <div className="game-controls">
              {gameState.gamePhase === 'playing' && gameState.currentPlayer === 'human' && (
                <>
                  <button
                    onClick={handleCallMinpai}
                    disabled={!canCallMinpai}
                    className={`control-btn minpai-btn ${canCallMinpai ? 'available' : ''}`}
                  >
                    🗣️ 闽派！
                  </button>
                  <div className="game-tips">
                    {canCallMinpai && <p>💡 你可以叫闽派了！</p>}
                    {playableCards.length === 0 && <p>⚠️ 没有可出的牌，将被罚牌</p>}
                  </div>
                </>
              )}

              {gameState.gamePhase === 'finished' && (
                <button onClick={handleRestart} className="control-btn restart-btn">
                  🔄 再来一局
                </button>
              )}
            </div>
          </div>

          {/* 玩家区域 */}
          <div className="player-area">
            <div className="player-info">
              <h3>👤 你</h3>
              <span className="card-count">手牌: {gameState.playerHand.length}张</span>
              {gameState.playerCalledMinpai && <span className="minpai-indicator">🗣️ 叫了闽派！</span>}
            </div>

            {/* 玩家手牌 */}
            <div className="player-hand">
              {gameState.playerHand.map((card, index) => (
                <DraggableCard
                  key={card.id}
                  card={card}
                  index={index}
                  isPlayable={playableCards.some(c => c.id === card.id)}
                  onPlay={handlePlayCard}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 游戏统计 */}
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">你的罚牌:</span>
            <span className="stat-value">{gameState.penalties.player}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">AI罚牌:</span>
            <span className="stat-value">{gameState.penalties.ai}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">剩余牌堆:</span>
            <span className="stat-value">{gameState.deck.length}</span>
          </div>
        </div>

        {/* 消息提示 */}
        {showMessage && (
          <div className="game-message">
            <div className="message-content">
              {message}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

// 卡牌显示组件
interface CardDisplayProps {
  card: Card;
  isCurrent?: boolean;
  isPlayable?: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ card, isCurrent = false, isPlayable = false }) => {
  return (
    <div
      className={`card-display ${isCurrent ? 'current' : ''} ${isPlayable ? 'playable' : ''}`}
      style={{
        borderColor: CULTURE_COLORS[card.culture],
        boxShadow: isPlayable ? `0 0 20px ${CULTURE_COLORS[card.culture]}40` : undefined
      }}
    >
      <div className="card-header">
        <span className="card-culture">{CULTURE_NAMES[card.culture]}</span>
        <span className="card-type">{CARD_TYPE_NAMES[card.type]}</span>
      </div>

      <div className="card-image">
        <img src={card.image} alt={card.name} />
      </div>

      <div className="card-name">
        {card.name}
      </div>

      {isPlayable && (
        <div className="playable-indicator">✨</div>
      )}
    </div>
  );
};

// 可拖拽卡牌组件
interface DraggableCardProps {
  card: Card;
  index: number;
  isPlayable: boolean;
  onPlay: (cardId: string) => void;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ card, index, isPlayable, onPlay }) => {
  const handleClick = () => {
    if (isPlayable) {
      onPlay(card.id);
    }
  };

  return (
    <div
      className={`player-card ${isPlayable ? 'playable' : 'unplayable'}`}
      onClick={handleClick}
      style={{
        transform: `translateX(${index * -20}px)`,
        zIndex: index
      }}
    >
      <CardDisplay card={card} isPlayable={isPlayable} />
    </div>
  );
};

export default GameBoard;
