// 游戏引擎 - 管理游戏状态和流程
import { Card, GameState, GameMove, GameConfig } from './gameTypes';
import {
  generateCardDeck,
  shuffleDeck,
  dealCards,
  getStartingCard,
  canPlayCard,
  getPlayableCards,
  canCallMinpai,
  isGameFinished,
  getWinner
} from './cardData';
import { GameAI, createAI, getAIDecisionDelay } from './gameAI';
import { SmartAIController } from './alphaBetaPruning';
import axios from 'axios';

export class GameEngine {
  private gameState: GameState;
  private smartAI: SmartAIController;
  private config: GameConfig;
  private gameHistory: GameMove[] = [];
  private onStateChange?: (state: GameState) => void;
  private onGameEnd?: (winner: 'human' | 'ai', finalState: GameState) => void;
  private isAIThinking: boolean = false; // 防止重复AI调用

  constructor(config: Partial<GameConfig> = {}) {
    this.config = {
      initialHandSize: 12,
      maxPenalties: 5,
      enableSound: true,
      aiDifficulty: 'medium',
      ...config
    };

    this.smartAI = new SmartAIController(this.config.aiDifficulty);
    this.gameState = this.initializeGame();
  }

  // 初始化游戏
  private initializeGame(): GameState {
    // 生成并洗牌
    const deck = generateCardDeck();
    const shuffledDeck = shuffleDeck(deck);

    // 发牌
    const { playerHand, aiHand, remainingDeck } = dealCards(shuffledDeck, this.config.initialHandSize);

    // 获取起始牌
    const startingCard = getStartingCard(remainingDeck);
    const finalDeck = remainingDeck.slice(1); // 移除起始牌

    return {
      gamePhase: 'playing',
      currentPlayer: 'human', // 玩家先手
      currentCard: startingCard,
      deck: finalDeck,
      playerHand,
      aiHand,
      playerCalledMinpai: false,
      aiCalledMinpai: false,
      penalties: { player: 0, ai: 0 },
      roundCount: 1,
      gameStartTime: new Date(),
      winner: null,
      gameEndTime: null
    };
  }

  // 设置状态变化回调
  setStateChangeCallback(callback: (state: GameState) => void) {
    this.onStateChange = callback;
  }

  // 设置游戏结束回调
  setGameEndCallback(callback: (winner: 'human' | 'ai', finalState: GameState) => void) {
    this.onGameEnd = callback;
  }

  // 获取当前游戏状态
  getGameState(): GameState {
    return { ...this.gameState };
  }

  // 玩家出牌
  async playCard(cardId: string): Promise<{ success: boolean; message?: string }> {
    if (this.gameState.gamePhase !== 'playing' || this.gameState.currentPlayer !== 'human') {
      return { success: false, message: '现在不是你的回合' };
    }

    // 查找卡牌
    const cardIndex = this.gameState.playerHand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) {
      return { success: false, message: '卡牌不存在' };
    }

    const card = this.gameState.playerHand[cardIndex];

    // 验证是否可以出牌
    if (!canPlayCard(card, this.gameState.currentCard)) {
      return { success: false, message: '这张牌不能出' };
    }

    // 执行出牌
    this.executeMove(card, 'human');

    // 检查游戏是否结束
    if (isGameFinished(this.gameState.playerHand, this.gameState.aiHand)) {
      this.endGame();
      return { success: true, message: '游戏结束！' };
    }

    // 检查玩家是否还有可出的牌
    const playerPlayableCards = getPlayableCards(this.gameState.playerHand, this.gameState.currentCard);
    if (playerPlayableCards.length === 0) {
      console.log('⚠️ 玩家没有可出的牌，执行罚牌');
      const penaltySuccess = this.applyPenalty('human');

      if (penaltySuccess) {
        // 等待状态更新，确保UI显示新手牌
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('⏳ 等待玩家罚牌状态更新完成');
      }
    }

    // 切换到AI回合
    console.log('🔄 切换到AI回合');
    this.gameState.currentPlayer = 'ai';
    this.notifyStateChange();

    // AI思考并出牌 - 使用Promise替代setTimeout确保时序正确
    try {
      console.log('⏳ AI开始思考...');
      await new Promise(resolve => setTimeout(resolve, 500)); // 短暂延迟
      console.log('🤖 AI思考完成，开始出牌');
      await this.aiTurn();
      console.log('✅ AI出牌完成');
    } catch (error) {
      console.error('❌ AI出牌过程出错:', error);
    }

    return { success: true };
  }

  // AI回合
  private async aiTurn() {
    if (this.gameState.gamePhase !== 'playing' || this.gameState.currentPlayer !== 'ai') {
      console.log('⚠️ AI回合检查失败 - 游戏阶段:', this.gameState.gamePhase, '当前玩家:', this.gameState.currentPlayer);
      return;
    }

    // 防止重复AI调用
    if (this.isAIThinking) {
      console.log('⚠️ AI正在思考中，跳过重复调用');
      return;
    }

    this.isAIThinking = true;
    console.log('🤖 AI回合开始执行');

    try {
      // 调用后端AI决策API
      const response = await axios.post('/api/game/ai-decision', {
        gameState: this.serializeGameState(),
        difficulty: this.config.aiDifficulty
      });

      if (response.data.success && response.data.card) {
        // AI出牌
        const aiCard = this.deserializeCard(response.data.card);
        console.log('🎯 AI出牌:', aiCard.name, '(ID:', aiCard.id + ')');

        // 执行出牌前状态
        console.log('📊 出牌前 - 当前牌:', this.gameState.currentCard?.name || '无');
        console.log('📊 出牌前 - AI手牌数:', this.gameState.aiHand.length);

        this.executeMove(aiCard, 'ai');

        // 执行出牌后状态
        console.log('📊 出牌后 - 当前牌:', this.gameState.currentCard?.name || '无');
        console.log('📊 出牌后 - AI手牌数:', this.gameState.aiHand.length);
        console.log('📊 出牌后 - 轮次:', this.gameState.roundCount);

        // 检查游戏是否结束
        if (isGameFinished(this.gameState.playerHand, this.gameState.aiHand)) {
          console.log('🏁 游戏结束检查: 游戏已结束');
          this.endGame();
          return;
        } else {
          console.log('🎮 游戏继续 - 准备切换到玩家回合');
        }
      } else {
        // AI没有可出牌，罚牌
        console.log('⚠️ AI无牌可出，执行罚牌');
        const penaltySuccess = this.applyPenalty('ai');

        if (penaltySuccess) {
          // 等待状态更新，确保UI显示新手牌
          await new Promise(resolve => setTimeout(resolve, 200));
          console.log('⏳ 等待AI罚牌状态更新完成');
        }

        // 检查游戏是否结束
        if (isGameFinished(this.gameState.playerHand, this.gameState.aiHand)) {
          console.log('🏁 游戏结束检查: 游戏已结束');
          this.endGame();
          return;
        }
      }
    } catch (error) {
      console.error('❌ AI决策失败:', error);
      // 如果API调用失败，使用前端AI作为后备
      const aiCard = await this.smartAI.makeDecision(this.gameState);
      if (aiCard) {
        console.log('🔄 使用前端AI后备 - 出牌:', aiCard.name);
        this.executeMove(aiCard, 'ai');

        // 检查游戏是否结束
        if (isGameFinished(this.gameState.playerHand, this.gameState.aiHand)) {
          console.log('🏁 游戏结束检查: 游戏已结束');
          this.endGame();
          return;
        }
      } else {
        console.log('⚠️ 前端AI也无牌可出，执行罚牌');
        this.applyPenalty('ai');

        // 检查游戏是否结束
        if (isGameFinished(this.gameState.playerHand, this.gameState.aiHand)) {
          console.log('🏁 游戏结束检查: 游戏已结束');
          this.endGame();
          return;
        }
      }
    }

    // 统一的状态管理和回合切换
    console.log('🔄 准备切换回合 - 当前玩家:', this.gameState.currentPlayer);
    this.gameState.currentPlayer = 'human';
    console.log('✅ 回合已切换 - 新当前玩家:', this.gameState.currentPlayer);
    this.notifyStateChange();
    console.log('📢 状态变化已通知 - AI回合结束');

    // 重置AI思考标志
    this.isAIThinking = false;
  }

  // 执行移动
  private executeMove(card: Card, player: 'human' | 'ai') {
    // 从手牌中移除卡牌
    if (player === 'human') {
      this.gameState.playerHand = this.gameState.playerHand.filter(c => c.id !== card.id);
    } else {
      this.gameState.aiHand = this.gameState.aiHand.filter(c => c.id !== card.id);
    }

    // 更新当前牌
    this.gameState.currentCard = card;

    // 记录移动历史
    const move: GameMove = {
      player,
      card,
      timestamp: new Date(),
      isValid: true
    };
    this.gameHistory.push(move);

    // 重置叫牌状态
    if (player === 'human') {
      this.gameState.playerCalledMinpai = false;
    } else {
      this.gameState.aiCalledMinpai = false;
    }

    this.gameState.roundCount++;
  }

  // 叫"闽派" - 简化机制
  callMinpai(): { success: boolean; message?: string } {
    if (this.gameState.gamePhase !== 'playing' || this.gameState.currentPlayer !== 'human') {
      return { success: false, message: '现在不是你的回合' };
    }

    if (this.gameState.playerHand.length !== 1) {
      return { success: false, message: '你不能叫闽派' };
    }

    // 标记叫牌成功
    this.gameState.playerCalledMinpai = true;
    console.log('🗣️ 玩家叫了闽派！');

    // 通知状态变化（UI更新）
    this.notifyStateChange();

    return { success: true, message: '叫牌成功！' };
  }

  // 超时罚牌 - 公共方法
  timeoutPenalty(player: 'human' | 'ai'): { success: boolean; message?: string } {
    console.log(`⏰ ${player === 'human' ? '玩家' : 'AI'}超时罚牌`);

    const penaltySuccess = this.applyPenalty(player);

    if (penaltySuccess) {
      return { success: true, message: '超时罚牌成功' };
    } else {
      return { success: false, message: '罚牌失败' };
    }
  }



  // 应用罚牌
  private applyPenalty(player: 'human' | 'ai'): boolean {
    console.log(`🃏 ${player === 'human' ? '玩家' : 'AI'}开始执行罚牌`);

    const handBefore = player === 'human' ? this.gameState.playerHand.length : this.gameState.aiHand.length;
    let cardsAdded = 0;
    const penaltyCards: Card[] = [];

    // 抽取两张牌
    for (let i = 0; i < 2; i++) {
      // 如果牌堆空了，需要洗牌
      if (this.gameState.deck.length === 0) {
        console.log('🃏 牌堆已空，尝试洗牌');
        const shuffleSuccess = this.shuffleDiscardPile();
        if (!shuffleSuccess) {
          console.log('🃏 无法洗牌，停止罚牌');
          break;
        }
      }

      // 如果还是没有牌，停止罚牌
      if (this.gameState.deck.length === 0) {
        console.log('🃏 牌堆仍然为空，无法继续罚牌');
        break;
      }

      const penaltyCard = this.gameState.deck[0];
      this.gameState.deck = this.gameState.deck.slice(1);
      penaltyCards.push(penaltyCard);

      if (player === 'human') {
        this.gameState.playerHand.push(penaltyCard);
        console.log(`✅ 玩家获得罚牌: ${penaltyCard.name} (${penaltyCard.culture}, ${penaltyCard.type})`);
      } else {
        this.gameState.aiHand.push(penaltyCard);
        console.log(`✅ AI获得罚牌: ${penaltyCard.name} (${penaltyCard.culture}, ${penaltyCard.type})`);
      }

      cardsAdded++;
    }

    const handAfter = player === 'human' ? this.gameState.playerHand.length : this.gameState.aiHand.length;

    // 验证罚牌是否成功
    if (cardsAdded === 0) {
      console.log('❌ 罚牌失败：没有牌被添加到手牌');
      return false;
    }

    console.log(`📊 罚牌结果: ${handBefore} → ${handAfter}张牌 (增加了${cardsAdded}张)`);
    console.log(`🃏 被罚的牌: ${penaltyCards.map(card => card.name).join(', ')}`);

    // 更新罚牌计数
    if (player === 'human') {
      this.gameState.penalties.player++;
      console.log(`📊 玩家罚牌次数: ${this.gameState.penalties.player}`);
    } else {
      this.gameState.penalties.ai++;
      console.log(`📊 AI罚牌次数: ${this.gameState.penalties.ai}`);
    }

    // 通知状态变化
    this.notifyStateChange();

    console.log(`✅ ${player === 'human' ? '玩家' : 'AI'}罚牌完成`);
    return true;
  }

  // 洗牌机制 - 将弃牌堆重新洗入牌堆
  private shuffleDiscardPile(): boolean {
    console.log('🔄 开始洗牌...');

    // 收集所有已出的牌（从游戏历史中）
    const discardPile: Card[] = [];

    // 从游戏历史中收集已出的牌
    for (const move of this.gameHistory) {
      discardPile.push(move.card);
    }

    console.log(`🃏 弃牌堆有 ${discardPile.length} 张牌`);

    // 检查是否有足够的牌
    if (discardPile.length < 2) {
      console.log('🃏 弃牌堆牌数不足，无法洗牌');
      return false;
    }

    // 洗牌
    const shuffledDiscardPile = shuffleDeck(discardPile);

    // 将洗好的牌加入牌堆
    this.gameState.deck = [...this.gameState.deck, ...shuffledDiscardPile];

    // 清空游戏历史（因为这些牌又回到了牌堆）
    this.gameHistory = [];

    console.log(`✅ 洗牌完成，牌堆现在有 ${this.gameState.deck.length} 张牌`);
    return true;
  }

  // 结束游戏
  private endGame() {
    this.gameState.gamePhase = 'finished';
    this.gameState.gameEndTime = new Date();

    if (!this.gameState.winner) {
      this.gameState.winner = getWinner(this.gameState.playerHand, this.gameState.aiHand);
    }

    this.notifyStateChange();

    if (this.onGameEnd && this.gameState.winner) {
      this.onGameEnd(this.gameState.winner, this.gameState);
    }
  }

  // 重新开始游戏
  restartGame(): GameState {
    this.gameState = this.initializeGame();
    this.gameHistory = [];
    this.notifyStateChange();
    return this.gameState;
  }

  // 获取可出牌列表
  getPlayableCards(): Card[] {
    if (this.gameState.currentPlayer === 'human') {
      return getPlayableCards(this.gameState.playerHand, this.gameState.currentCard);
    }
    return [];
  }

  // 获取游戏统计
  getGameStats() {
    const gameTime = this.gameState.gameEndTime
      ? this.gameState.gameEndTime.getTime() - this.gameState.gameStartTime.getTime()
      : Date.now() - this.gameState.gameStartTime.getTime();

    return {
      rounds: this.gameState.roundCount,
      gameTime: Math.floor(gameTime / 1000), // 秒
      playerCardsLeft: this.gameState.playerHand.length,
      aiCardsLeft: this.gameState.aiHand.length,
      penalties: this.gameState.penalties,
      winner: this.gameState.winner
    };
  }

  // 通知状态变化
  private notifyStateChange() {
    if (this.onStateChange) {
      // 🔧 确保传递的是深拷贝，避免引用问题
      const stateCopy = JSON.parse(JSON.stringify(this.gameState));
      console.log('📢 通知状态变化 - 当前牌:', stateCopy.currentCard?.name || '无');
      console.log('📢 通知状态变化 - 当前玩家:', stateCopy.currentPlayer);
      this.onStateChange(stateCopy);
    }
  }

  // 销毁游戏引擎
  destroy() {
    this.onStateChange = undefined;
    this.onGameEnd = undefined;
  }

  // 序列化游戏状态为API格式
  private serializeGameState(): any {
    return {
      game_phase: this.gameState.gamePhase,
      current_player: this.gameState.currentPlayer,
      current_card: this.gameState.currentCard ? this.serializeCard(this.gameState.currentCard) : null,
      deck: this.gameState.deck.map(card => this.serializeCard(card)),
      player_hand: this.gameState.playerHand.map(card => this.serializeCard(card)),
      ai_hand: this.gameState.aiHand.map(card => this.serializeCard(card)),
      player_called_minpai: this.gameState.playerCalledMinpai,
      ai_called_minpai: this.gameState.aiCalledMinpai,
      penalties: this.gameState.penalties,
      round_count: this.gameState.roundCount,
      game_start_time: this.gameState.gameStartTime.getTime() / 1000, // 转换为秒
      winner: this.gameState.winner,
      game_end_time: this.gameState.gameEndTime ? this.gameState.gameEndTime.getTime() / 1000 : null
    };
  }

  // 序列化卡牌
  private serializeCard(card: Card): any {
    return {
      id: card.id,
      name: card.name,
      culture: card.culture,
      type: card.type,
      image: card.image
    };
  }

  // 反序列化卡牌
  private deserializeCard(data: any): Card {
    return {
      id: data.id,
      name: data.name,
      culture: data.culture,
      type: data.type,
      image: data.image
    };
  }
}

// 创建游戏引擎实例
export const createGameEngine = (config?: Partial<GameConfig>): GameEngine => {
  return new GameEngine(config);
};
