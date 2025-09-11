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
  const [minpaiCountdown, setMinpaiCountdown] = useState<number | null>(null); // 叫牌倒计时
  const prevGameStateRef = useRef<GameState | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化游戏
  useEffect(() => {
    const engine = createGameEngine({
      aiDifficulty: difficulty,
      enableSound: true
    });

    engine.setStateChangeCallback((newState) => {
      const prevState = prevGameStateRef.current;

      console.log('🎮 前端收到状态变化:');
      console.log(`👤 玩家手牌: ${prevState?.playerHand.length || 0} → ${newState.playerHand.length}`);
      console.log(`🤖 AI手牌: ${prevState?.aiHand.length || 0} → ${newState.aiHand.length}`);
      console.log(`🃏 牌堆剩余: ${newState.deck.length}`);
      console.log(`📊 罚牌统计: 玩家${newState.penalties.player} | AI${newState.penalties.ai}`);
      console.log(`🎯 当前玩家: ${newState.currentPlayer}`);
      console.log(`🃏 当前牌: ${newState.currentCard?.name || '无'}`);

      // 检查是否有手牌变化（罚牌）
      const playerHandChanged = (prevState?.playerHand.length || 0) !== newState.playerHand.length;
      const aiHandChanged = (prevState?.aiHand.length || 0) !== newState.aiHand.length;

      if (playerHandChanged) {
        console.log('🎯 玩家手牌发生变化，可能是罚牌结果');
      }
      if (aiHandChanged) {
        console.log('🎯 AI手牌发生变化，可能是罚牌结果');
      }

      // 检查是否需要启动叫牌倒计时
      if (newState.currentPlayer === 'human' && newState.playerHand.length === 1 && newState.gamePhase === 'playing') {
        console.log('⏰ 玩家只剩一张牌，开始5秒叫牌倒计时');
        startMinpaiCountdown();
      } else {
        // 取消倒计时
        clearMinpaiCountdown();
      }

      // 🔧 强制更新状态，确保UI重新渲染
      setGameState(prevState => {
        // 如果状态没有实质性变化，强制创建一个新对象
        if (JSON.stringify(prevState) === JSON.stringify(newState)) {
          console.log('⚠️ 检测到状态无变化，强制更新');
          return { ...newState, _forceUpdate: Date.now() };
        }
        return newState;
      });

      prevGameStateRef.current = { ...newState };

      console.log('✅ 前端状态更新完成\n');
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

    // 🔴 叫牌不切换回合，继续当前回合
    console.log('🗣️ 叫牌完成，继续当前玩家回合');
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

    console.log('⏰ 开始5秒叫牌倒计时');
    setMinpaiCountdown(5);

    countdownRef.current = setInterval(() => {
      setMinpaiCountdown(prev => {
        if (prev === null || prev <= 1) {
          // 倒计时结束，AI处罚玩家
          console.log('⏰ 倒计时结束，AI处罚玩家');
          clearMinpaiCountdown();

          // 直接罚牌玩家
          if (gameEngine) {
            console.log('⚠️ 玩家未在5秒内叫牌，自动罚牌');

            // 调用游戏引擎的超时罚牌方法
            const result = gameEngine.timeoutPenalty('human');

            if (result.success) {
              showGameMessage('⏰ 时间到！未叫牌，自动罚牌');
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

                  {/* 叫牌倒计时显示 */}
                  {minpaiCountdown !== null && (
                    <div className="countdown-display">
                      <div className="countdown-timer">
                        ⏰ {minpaiCountdown}
                      </div>
                      <div className="countdown-text">
                        秒内叫牌
                      </div>
                    </div>
                  )}

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
