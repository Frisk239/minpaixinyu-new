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
  const isPenaltyProcessingRef = useRef<boolean>(false); // 防止重复罚牌

  // 初始化游戏
  useEffect(() => {
    const engine = createGameEngine({
      aiDifficulty: difficulty,
      enableSound: true
    });

    // 使用ref来存储引擎引用，确保回调中能正确访问
    const engineRef = { current: engine };

    engine.setStateChangeCallback((newState) => {
      const timestamp = Date.now();
      const prevState = prevGameStateRef.current;

      console.log(`🎮 [${timestamp}] 前端收到状态变化`);
      console.log(`👤 [${timestamp}] 玩家手牌: ${prevState?.playerHand.length || 0} → ${newState.playerHand.length}`);
      console.log(`🤖 [${timestamp}] AI手牌: ${prevState?.aiHand.length || 0} → ${newState.aiHand.length}`);
      console.log(`🃏 [${timestamp}] 牌堆剩余: ${newState.deck.length}`);
      console.log(`📊 [${timestamp}] 罚牌统计: 玩家${newState.penalties.player} | AI${newState.penalties.ai}`);
      console.log(`🎯 [${timestamp}] 当前玩家: ${newState.currentPlayer}`);
      console.log(`🃏 [${timestamp}] 当前牌: ${newState.currentCard?.name || '无'}`);
      console.log(`🎭 [${timestamp}] 游戏阶段: ${newState.gamePhase}`);

      // 检查是否有手牌变化（罚牌）
      const playerHandChanged = (prevState?.playerHand.length || 0) !== newState.playerHand.length;
      const aiHandChanged = (prevState?.aiHand.length || 0) !== newState.aiHand.length;

      if (playerHandChanged) {
        console.log(`🎯 [${timestamp}] 玩家手牌发生变化，可能是罚牌结果 (+${newState.playerHand.length - (prevState?.playerHand.length || 0)})`);
      }
      if (aiHandChanged) {
        console.log(`🎯 [${timestamp}] AI手牌发生变化，可能是罚牌结果 (+${newState.aiHand.length - (prevState?.aiHand.length || 0)})`);
      }

      // 检查是否需要启动叫牌倒计时
      if (newState.currentPlayer === 'human' && newState.playerHand.length === 1 && newState.gamePhase === 'playing') {
        console.log(`⏰ [${timestamp}] 玩家只剩一张牌，开始5秒叫牌倒计时`);
        console.log(`🔍 [${timestamp}] 叫牌倒计时条件满足:`, {
          currentPlayer: newState.currentPlayer,
          playerHandSize: newState.playerHand.length,
          gamePhase: newState.gamePhase
        });
        startMinpaiCountdown();
      } else {
        console.log(`🔍 [${timestamp}] 叫牌倒计时条件不满足:`, {
          currentPlayer: newState.currentPlayer,
          playerHandSize: newState.playerHand.length,
          gamePhase: newState.gamePhase
        });
        // 取消倒计时
        clearMinpaiCountdown();
      }

      console.log(`🔄 [${timestamp}] 开始更新React状态...`);
      console.log(`🔍 [${timestamp}] 新状态详情:`, {
        currentPlayer: newState.currentPlayer,
        playerHandSize: newState.playerHand.length,
        aiHandSize: newState.aiHand.length,
        gamePhase: newState.gamePhase,
        currentCard: newState.currentCard?.name || '无'
      });

      // 🔧 强制更新状态，确保UI重新渲染
      setGameState(prevState => {
        console.log(`🔄 [${timestamp}] setGameState回调被调用`);
        // 如果状态没有实质性变化，强制创建一个新对象
        if (JSON.stringify(prevState) === JSON.stringify(newState)) {
          console.log(`⚠️ [${timestamp}] 检测到状态无变化，强制更新`);
          return { ...newState, _forceUpdate: Date.now() };
        }
        console.log(`✅ [${timestamp}] 状态有变化，正常更新`);
        return newState;
      });

      prevGameStateRef.current = { ...newState };

      console.log(`✅ [${timestamp}] 前端状态更新完成 - 总耗时: ${Date.now() - timestamp}ms\n`);

      // 🔍 检查是否需要触发玩家回合逻辑
      if (newState.currentPlayer === 'human' && newState.gamePhase === 'playing') {
        console.log(`🎯 [${timestamp}] 切换到玩家回合，检查可出牌`);

        // 使用ref中的引擎实例
        const currentEngine = engineRef.current;
        const playerPlayableCards = currentEngine?.getPlayableCards() || [];
        console.log(`🎲 [${timestamp}] 玩家回合可出牌数量: ${playerPlayableCards.length}`);

        if (playerPlayableCards.length === 0) {
          console.log(`⚠️ [${timestamp}] 玩家回合无牌可出，自动执行罚牌`);

          // 检查是否正在处理罚牌，防止重复执行
          if (isPenaltyProcessingRef.current) {
            console.log(`🚫 [${timestamp}] 罚牌正在处理中，跳过重复执行`);
            return;
          }

          // 标记开始处理罚牌
          isPenaltyProcessingRef.current = true;

          // 使用游戏引擎的公共方法执行罚牌
          if (currentEngine) {
            try {
              console.log(`🔄 [${timestamp}] 开始执行罚牌...`);

              // 使用timeoutPenalty方法，它会调用applyPenalty
              const penaltyResult = currentEngine.timeoutPenalty('human');

              if (penaltyResult.success) {
                console.log(`✅ [${timestamp}] 自动罚牌成功`);
                // 强制触发状态更新
                setTimeout(() => {
                  console.log(`🔄 [${timestamp}] 罚牌后准备切换到AI回合`);
                  if (currentEngine) {
                    // 手动切换到AI回合
                    const engine = currentEngine as any;
                    if (engine && engine.gameState) {
                      engine.gameState.currentPlayer = 'ai';
                      engine.notifyStateChange();

                      // 触发AI回合
                      setTimeout(() => {
                        if (engine.aiTurn) {
                          engine.aiTurn().catch((error: any) => {
                            console.error('AI回合执行失败:', error);
                          });
                        }
                        // 重置罚牌处理标志
                        isPenaltyProcessingRef.current = false;
                      }, 500);
                    } else {
                      // 重置罚牌处理标志
                      isPenaltyProcessingRef.current = false;
                    }
                  } else {
                    // 重置罚牌处理标志
                    isPenaltyProcessingRef.current = false;
                  }
                }, 300);
              } else {
                console.log(`❌ [${timestamp}] 自动罚牌失败: ${penaltyResult.message}`);
                // 重置罚牌处理标志
                isPenaltyProcessingRef.current = false;
              }
            } catch (error: any) {
              console.error(`❌ [${timestamp}] 罚牌执行出错:`, error);
              // 重置罚牌处理标志
              isPenaltyProcessingRef.current = false;
            }
          } else {
            console.log(`❌ [${timestamp}] 游戏引擎不可用`);
            // 重置罚牌处理标志
            isPenaltyProcessingRef.current = false;
          }
        } else {
          console.log(`✅ [${timestamp}] 玩家回合有${playerPlayableCards.length}张牌可出`);
        }
      }
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



  // 开始叫牌倒计时
  const startMinpaiCountdown = () => {
    const timestamp = Date.now();
    console.log(`⏰ [${timestamp}] 开始5秒叫牌倒计时`);
    console.log(`🔍 [${timestamp}] 当前游戏状态:`, {
      currentPlayer: gameState?.currentPlayer,
      playerHandSize: gameState?.playerHand.length,
      aiHandSize: gameState?.aiHand.length,
      gamePhase: gameState?.gamePhase
    });

    // 清除之前的倒计时
    clearMinpaiCountdown();

    setMinpaiCountdown(5);

    countdownRef.current = setInterval(() => {
      setMinpaiCountdown(prev => {
        const currentTime = Date.now();
        console.log(`⏰ [${currentTime}] 倒计时检查 - 当前值: ${prev}`);

        if (prev === null || prev <= 1) {
          // 倒计时结束，AI处罚玩家
          console.log(`⏰ [${currentTime}] 倒计时结束，AI处罚玩家`);
          console.log(`📊 [${currentTime}] 倒计时总耗时: ${currentTime - timestamp}ms`);
          clearMinpaiCountdown();

          // 倒计时结束，执行罚牌
          console.log(`⏰ [${currentTime}] 倒计时结束，AI处罚玩家`);
          console.log(`📊 [${currentTime}] 倒计时总耗时: ${currentTime - timestamp}ms`);
          clearMinpaiCountdown();

          // 直接罚牌玩家
          if (gameEngine) {
            console.log(`⚠️ [${currentTime}] 玩家未在5秒内叫牌，自动罚牌`);
            console.log(`🔍 [${currentTime}] 游戏引擎状态:`, gameEngine ? '可用' : '不可用');

            try {
              // 调用游戏引擎的超时罚牌方法
              const result = gameEngine.timeoutPenalty('human');
              console.log(`📊 [${currentTime}] 罚牌结果:`, result);

              if (result.success) {
                console.log(`✅ [${currentTime}] 罚牌成功，显示消息`);
                showGameMessage('⏰ 时间到！未叫牌，自动罚牌');
              } else {
                console.log(`❌ [${currentTime}] 罚牌失败: ${result.message}`);
                showGameMessage('⚠️ 罚牌失败，请继续游戏');
              }
            } catch (error) {
              console.error(`❌ [${currentTime}] 罚牌过程中发生错误:`, error);
              showGameMessage('⚠️ 系统错误，请刷新页面');
            }
          } else {
            console.error(`❌ [${currentTime}] 游戏引擎不可用`);
          }

          return null;
        }

        const newValue = prev - 1;
        console.log(`⏰ [${currentTime}] 倒计时更新: ${prev} → ${newValue}`);
        return newValue;
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

        {/* 返回按钮移到游戏统计区域 */}

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
            <span className="stat-label">回合:</span>
            <span className="stat-value">{gameState.roundCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">当前玩家:</span>
            <span className="stat-value">{gameState.currentPlayer === 'human' ? '你' : 'AI'}</span>
          </div>
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
