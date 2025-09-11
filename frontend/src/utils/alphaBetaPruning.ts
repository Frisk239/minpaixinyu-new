// α-β剪枝算法实现
import { Card, GameState, CultureType, CardType } from './gameTypes';
import { canPlayCard, getPlayableCards } from './cardData';

export class AlphaBetaPruning {
  private maxDepth: number;
  private timeLimit: number;
  private startTime: number;

  constructor(maxDepth = 4, timeLimit = 1000) {
    this.maxDepth = maxDepth;
    this.timeLimit = timeLimit;
    this.startTime = Date.now();
  }

  // 主搜索函数
  search(
    gameState: GameState,
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean
  ): { score: number; bestMove?: Card; nodesEvaluated: number } {
    this.startTime = Date.now();
    return this.alphaBetaSearch(gameState, depth, alpha, beta, maximizingPlayer, 0);
  }

  // α-β剪枝搜索实现
  private alphaBetaSearch(
    gameState: GameState,
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean,
    nodesEvaluated: number
  ): { score: number; bestMove?: Card; nodesEvaluated: number } {

    // 时间限制检查
    if (Date.now() - this.startTime > this.timeLimit) {
      return {
        score: this.evaluatePosition(gameState),
        nodesEvaluated: nodesEvaluated + 1
      };
    }

    // 深度限制或终止条件
    if (depth === 0 || this.isTerminal(gameState)) {
      return {
        score: this.evaluatePosition(gameState),
        nodesEvaluated: nodesEvaluated + 1
      };
    }

    // 获取可能的移动
    const possibleMoves = this.getPossibleMoves(gameState);

    // 如果没有可移动作，返回当前位置评估
    if (possibleMoves.length === 0) {
      return {
        score: this.evaluatePosition(gameState),
        nodesEvaluated: nodesEvaluated + 1
      };
    }

    if (maximizingPlayer) {
      // 最大化玩家 (AI)
      let maxEval = -Infinity;
      let bestMove: Card | undefined;

      for (const move of possibleMoves) {
        const newState = this.makeMove(gameState, move, 'ai');
        const result = this.alphaBetaSearch(
          newState,
          depth - 1,
          alpha,
          beta,
          false,
          nodesEvaluated + 1
        );

        if (result.score > maxEval) {
          maxEval = result.score;
          bestMove = move;
        }

        alpha = Math.max(alpha, result.score);
        nodesEvaluated = result.nodesEvaluated;

        // β剪枝
        if (beta <= alpha) {
          break; // 剪枝
        }
      }

      return { score: maxEval, bestMove, nodesEvaluated };
    } else {
      // 最小化玩家 (人类)
      let minEval = Infinity;

      for (const move of possibleMoves) {
        const newState = this.makeMove(gameState, move, 'human');
        const result = this.alphaBetaSearch(
          newState,
          depth - 1,
          alpha,
          beta,
          true,
          nodesEvaluated + 1
        );

        minEval = Math.min(minEval, result.score);
        beta = Math.min(beta, result.score);
        nodesEvaluated = result.nodesEvaluated;

        // α剪枝
        if (beta <= alpha) {
          break; // 剪枝
        }
      }

      return { score: minEval, nodesEvaluated };
    }
  }

  // 启发式评估函数
  private evaluatePosition(gameState: GameState): number {
    const { playerHand, aiHand, currentCard, penalties } = gameState;

    let score = 0;

    // 1. 手牌数量差异 (核心因素)
    const handDifference = aiHand.length - playerHand.length;
    score += handDifference * 15;

    // 2. 罚牌差异
    const penaltyDifference = penalties.player - penalties.ai;
    score += penaltyDifference * 10;

    // 3. 卡牌质量评估
    score += this.evaluateHandQuality(aiHand) * 3;
    score -= this.evaluateHandQuality(playerHand) * 3;

    // 4. 出牌机会评估
    const aiPlayable = getPlayableCards(aiHand, currentCard).length;
    const playerPlayable = getPlayableCards(playerHand, currentCard).length;
    score += (aiPlayable - playerPlayable) * 5;

    // 5. 特殊情况评估
    if (aiHand.length === 1) score += 20; // AI快赢了
    if (playerHand.length === 1) score -= 25; // 玩家快赢了

    // 6. 文化控制评估
    score += this.evaluateCultureControl(aiHand, playerHand) * 2;

    return score;
  }

  // 评估手牌质量
  private evaluateHandQuality(hand: Card[]): number {
    if (hand.length === 0) return 0;

    let quality = 0;

    // 文化多样性
    const cultures = new Set(hand.map(card => card.culture));
    quality += cultures.size * 3;

    // 类型平衡性
    const types = hand.reduce((acc, card) => {
      acc[card.type] = (acc[card.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeBalance = Math.min(...Object.values(types));
    quality += typeBalance * 2;

    // 特殊卡牌价值
    hand.forEach(card => {
      // 评估卡牌的战略价值
      quality += this.getCardStrategicValue(card, hand);
    });

    return quality / hand.length; // 标准化
  }

  // 评估文化控制
  private evaluateCultureControl(aiHand: Card[], playerHand: Card[]): number {
    const cultures: CultureType[] = ['fuzhou', 'quanzhou', 'nanping', 'longyan', 'putian'];
    let controlScore = 0;

    cultures.forEach(culture => {
      const aiCultureCards = aiHand.filter(card => card.culture === culture).length;
      const playerCultureCards = playerHand.filter(card => card.culture === culture).length;

      if (aiCultureCards > playerCultureCards) {
        controlScore += 2;
      } else if (aiCultureCards < playerCultureCards) {
        controlScore -= 2;
      }
    });

    return controlScore;
  }

  // 获取卡牌战略价值
  private getCardStrategicValue(card: Card, hand: Card[]): number {
    let value = 1; // 基础价值

    // 唯一文化加分
    const sameCultureCards = hand.filter(c => c.culture === card.culture);
    if (sameCultureCards.length === 1) {
      value += 3; // 这是这个文化的最后一张牌
    }

    // 唯一类型加分
    const sameTypeCards = hand.filter(c => c.type === card.type);
    if (sameTypeCards.length === 1) {
      value += 2; // 这是这个类型的最后一张牌
    }

    // 根据卡牌类型调整价值
    switch (card.type) {
      case 'character':
        value += 1.5; // 人物牌略有优势
        break;
      case 'location':
        value += 1.2; // 地点牌中等价值
        break;
      case 'quote':
        value += 1.0; // 语录牌基础价值
        break;
    }

    return value;
  }

  // 获取所有可能移动
  private getPossibleMoves(gameState: GameState): Card[] {
    const { aiHand, currentCard } = gameState;
    return getPlayableCards(aiHand, currentCard);
  }

  // 执行移动
  private makeMove(gameState: GameState, card: Card, player: 'human' | 'ai'): GameState {
    const newState = { ...gameState };

    // 从手牌中移除卡牌
    if (player === 'human') {
      newState.playerHand = newState.playerHand.filter(c => c.id !== card.id);
    } else {
      newState.aiHand = newState.aiHand.filter(c => c.id !== card.id);
    }

    // 更新当前牌
    newState.currentCard = card;

    return newState;
  }

  // 检查是否为终止状态
  private isTerminal(gameState: GameState): boolean {
    return gameState.aiHand.length === 0 ||
           gameState.playerHand.length === 0 ||
           gameState.gamePhase === 'finished';
  }
}

// 启发式剪枝优化
export class HeuristicPruning {
  // 快速预剪枝
  static quickPrune(
    candidates: Card[],
    gameState: GameState
  ): Card[] {
    if (candidates.length <= 3) return candidates;

    const { currentCard } = gameState;

    if (!currentCard) return candidates;

    // 计算每个候选牌的优先级分数
    const scoredCandidates = candidates.map(card => ({
      card,
      score: this.calculatePriorityScore(card, currentCard, gameState)
    }));

    // 按分数排序
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 只保留前60%的候选牌
    const keepCount = Math.max(2, Math.ceil(scoredCandidates.length * 0.6));

    return scoredCandidates.slice(0, keepCount).map(item => item.card);
  }

  // 计算优先级分数
  private static calculatePriorityScore(
    card: Card,
    currentCard: Card,
    gameState: GameState
  ): number {
    let score = 0;

    // 文化匹配加分
    if (card.culture === currentCard.culture) {
      score += 15;
    }

    // 类型匹配加分
    if (card.type === currentCard.type) {
      score += 12;
    }

    // 唯一性加分
    const { aiHand } = gameState;
    const sameCultureCount = aiHand.filter(c => c.culture === card.culture).length;
    const sameTypeCount = aiHand.filter(c => c.type === card.type).length;

    if (sameCultureCount === 1) score += 8;
    if (sameTypeCount === 1) score += 6;

    // 手牌压力加分
    if (aiHand.length <= 3) score += 10;

    return score;
  }

  // 边界情况剪枝
  static boundaryPrune(
    candidates: Card[],
    gameState: GameState
  ): Card[] {
    // 如果只剩1-2张牌，保留所有
    if (gameState.aiHand.length <= 2) return candidates;

    // 如果候选牌很少，保留所有
    if (candidates.length <= 2) return candidates;

    // 如果时间紧张，只保留最好的几个
    const timeSpent = Date.now() - gameState.gameStartTime.getTime();
    if (timeSpent > 800 && candidates.length > 3) {
      return candidates.slice(0, 3);
    }

    return candidates;
  }

  // 动态调整搜索深度
  static adjustSearchDepth(
    baseDepth: number,
    gameState: GameState,
    timeSpent: number
  ): number {
    const { aiHand, playerHand } = gameState;

    // 如果手牌很少，增加搜索深度
    if (aiHand.length <= 3 || playerHand.length <= 3) {
      return Math.min(baseDepth + 1, 5);
    }

    // 如果时间不够，减少搜索深度
    if (timeSpent > 500) {
      return Math.max(baseDepth - 1, 2);
    }

    return baseDepth;
  }
}

// 智能AI控制器
export class SmartAIController {
  private alphaBeta: AlphaBetaPruning;
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
    this.alphaBeta = new AlphaBetaPruning(
      this.getMaxDepth(),
      this.getTimeLimit()
    );
  }

  // 根据难度获取参数
  private getMaxDepth(): number {
    switch (this.difficulty) {
      case 'easy': return 2;
      case 'medium': return 3;
      case 'hard': return 4;
      default: return 3;
    }
  }

  private getTimeLimit(): number {
    switch (this.difficulty) {
      case 'easy': return 300;
      case 'medium': return 800;
      case 'hard': return 1500;
      default: return 800;
    }
  }

  // 智能决策
  async makeDecision(gameState: GameState): Promise<Card | null> {
    const startTime = Date.now();

    // 1. 获取初始候选牌
    let candidates = this.getPlayableCards(gameState);

    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // 2. 启发式预剪枝
    candidates = HeuristicPruning.quickPrune(candidates, gameState);
    candidates = HeuristicPruning.boundaryPrune(candidates, gameState);

    if (candidates.length === 1) return candidates[0];

    // 3. 根据难度选择策略
    switch (this.difficulty) {
      case 'easy':
        return this.easyStrategy(candidates);
      case 'medium':
        return this.mediumStrategy(candidates, gameState, startTime);
      case 'hard':
        return this.hardStrategy(candidates, gameState, startTime);
      default:
        return this.mediumStrategy(candidates, gameState, startTime);
    }
  }

  // 简单策略
  private easyStrategy(candidates: Card[]): Card {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 中等策略
  private mediumStrategy(
    candidates: Card[],
    gameState: GameState,
    startTime: number
  ): Card {
    // 使用α-β剪枝但限制深度
    const result = this.alphaBeta.search(
      gameState,
      2, // 限制深度
      -Infinity,
      Infinity,
      true
    );

    return result.bestMove || candidates[0];
  }

  // 困难策略
  private hardStrategy(
    candidates: Card[],
    gameState: GameState,
    startTime: number
  ): Card {
    // 动态调整搜索深度
    const timeSpent = Date.now() - startTime;
    const adjustedDepth = HeuristicPruning.adjustSearchDepth(
      this.getMaxDepth(),
      gameState,
      timeSpent
    );

    // 完整α-β剪枝搜索
    const result = this.alphaBeta.search(
      gameState,
      adjustedDepth,
      -Infinity,
      Infinity,
      true
    );

    return result.bestMove || candidates[0];
  }

  // 获取可出牌
  private getPlayableCards(gameState: GameState): Card[] {
    const { aiHand, currentCard } = gameState;

    if (!currentCard) return aiHand;

    return aiHand.filter(card =>
      card.culture === currentCard.culture ||
      card.type === currentCard.type
    );
  }

  // 难度切换
  setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
    this.alphaBeta = new AlphaBetaPruning(
      this.getMaxDepth(),
      this.getTimeLimit()
    );
  }
}
