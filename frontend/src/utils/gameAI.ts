// AI算法系统
import { Card, GameState, CardAnalysis, AIStrategy, CultureType, CardType } from './gameTypes';
import { canPlayCard, getPlayableCards } from './cardData';
import { SmartAIController } from './alphaBetaPruning';

export class GameAI implements AIStrategy {
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
  }

  // 分析手牌
  analyzeHand(hand: Card[]): CardAnalysis {
    const playableCards = getPlayableCards(hand, null); // 临时分析，稍后会传入当前牌

    // 计算文化分布
    const cultureDistribution: Record<CultureType, number> = {
      fuzhou: 0,
      quanzhou: 0,
      nanping: 0,
      longyan: 0,
      putian: 0
    };

    // 计算卡牌类型分布
    const typeDistribution: Record<CardType, number> = {
      character: 0,
      location: 0,
      quote: 0
    };

    hand.forEach(card => {
      cultureDistribution[card.culture]++;
      typeDistribution[card.type]++;
    });

    // 计算手牌强度 (0-100)
    const handStrength = this.calculateHandStrength(hand, cultureDistribution, typeDistribution);

    return {
      playableCards,
      bestCard: this.selectBestCard(hand, null), // 临时分析
      handStrength,
      cultureDistribution,
      typeDistribution
    };
  }

  // 选择最佳出牌
  selectBestCard(hand: Card[], currentCard: Card | null): Card | null {
    const playableCards = getPlayableCards(hand, currentCard);

    if (playableCards.length === 0) {
      return null; // 没有可出牌
    }

    switch (this.difficulty) {
      case 'easy':
        return this.selectRandomCard(playableCards);
      case 'medium':
        return this.selectStrategicCard(playableCards, hand, currentCard);
      case 'hard':
        return this.selectOptimalCard(playableCards, hand, currentCard);
      default:
        return this.selectRandomCard(playableCards);
    }
  }

  // 判断是否应该叫"闽派"
  shouldCallMinpai(hand: Card[], opponentHandCount: number): boolean {
    if (hand.length !== 1) return false;

    // 简单AI: 随机决定
    if (this.difficulty === 'easy') {
      return Math.random() > 0.5;
    }

    // 中级AI: 基于对手手牌数量
    if (this.difficulty === 'medium') {
      // 如果对手手牌多，倾向于叫牌
      return opponentHandCount > 3;
    }

    // 高级AI: 更复杂的判断
    if (this.difficulty === 'hard') {
      // 如果对手手牌很多，很有可能叫牌
      if (opponentHandCount > 5) return true;
      // 如果对手手牌很少，谨慎叫牌
      if (opponentHandCount <= 2) return Math.random() > 0.7;
      // 中等情况随机
      return Math.random() > 0.4;
    }

    return false;
  }

  // 判断是否应该举报对方叫"闽派"
  shouldReportMinpai(opponentHandCount: number, gameHistory: any[]): boolean {
    // 如果对手叫"闽派"但手牌数不是1，肯定举报
    if (opponentHandCount !== 1) return true;

    // 其他情况基于AI难度
    switch (this.difficulty) {
      case 'easy':
        return Math.random() > 0.8; // 偶尔误报
      case 'medium':
        return Math.random() > 0.95; // 很少误报
      case 'hard':
        return false; // 从不误报
      default:
        return false;
    }
  }

  // 计算手牌强度
  private calculateHandStrength(
    hand: Card[],
    cultureDistribution: Record<CultureType, number>,
    typeDistribution: Record<CardType, number>
  ): number {
    let strength = 50; // 基础强度

    // 文化多样性加分
    const uniqueCultures = Object.values(cultureDistribution).filter(count => count > 0).length;
    strength += uniqueCultures * 5;

    // 类型平衡加分
    const typeBalance = Math.min(...Object.values(typeDistribution));
    strength += typeBalance * 3;

    // 手牌数量影响
    if (hand.length <= 3) strength += 20; // 快要赢了
    if (hand.length >= 8) strength -= 10; // 手牌太多

    return Math.max(0, Math.min(100, strength));
  }

  // 简单AI: 随机选择
  private selectRandomCard(playableCards: Card[]): Card {
    const randomIndex = Math.floor(Math.random() * playableCards.length);
    return playableCards[randomIndex];
  }

  // 中级AI: 策略性选择
  private selectStrategicCard(playableCards: Card[], hand: Card[], currentCard: Card | null): Card {
    if (playableCards.length === 1) {
      return playableCards[0];
    }

    // 优先选择能减少对手选择余地的牌
    const strategicCards = playableCards.map(card => ({
      card,
      score: this.calculateCardStrategicValue(card, hand, currentCard)
    }));

    strategicCards.sort((a, b) => b.score - a.score);
    return strategicCards[0].card;
  }

  // 高级AI: 优化选择
  private selectOptimalCard(playableCards: Card[], hand: Card[], currentCard: Card | null): Card {
    if (playableCards.length === 1) {
      return playableCards[0];
    }

    // 计算每张牌的综合价值
    const evaluatedCards = playableCards.map(card => ({
      card,
      score: this.calculateCardOptimalValue(card, hand, currentCard)
    }));

    evaluatedCards.sort((a, b) => b.score - a.score);
    return evaluatedCards[0].card;
  }

  // 计算卡牌的策略价值
  private calculateCardStrategicValue(card: Card, hand: Card[], currentCard: Card | null): number {
    let score = 0;

    // 基础分数
    score += 10;

    // 如果这张牌是手牌中唯一的文化类型，加分
    const sameCultureCards = hand.filter(c => c.culture === card.culture);
    if (sameCultureCards.length === 1) {
      score += 15; // 打出后对手就不能用这个文化了
    }

    // 如果这张牌是手牌中唯一的类型，加分
    const sameTypeCards = hand.filter(c => c.type === card.type);
    if (sameTypeCards.length === 1) {
      score += 10; // 打出后对手就不能用这个类型了
    }

    // 如果手牌只剩一张，加分（优先出牌）
    if (hand.length === 1) {
      score += 20;
    }

    return score;
  }

  // 计算卡牌的最优价值
  private calculateCardOptimalValue(card: Card, hand: Card[], currentCard: Card | null): number {
    let score = this.calculateCardStrategicValue(card, hand, currentCard);

    // 高级策略：考虑对手可能的反应
    if (currentCard) {
      // 如果这张牌会让对手很难出牌，加分
      const opponentPossiblePlays = this.simulateOpponentHand(card);
      if (opponentPossiblePlays < 2) {
        score += 25; // 对手选择很少，很好的牌
      }
    }

    // 考虑手牌的整体平衡
    const remainingHand = hand.filter(c => c.id !== card.id);
    const remainingStrength = this.analyzeHand(remainingHand).handStrength;
    score += (100 - remainingStrength) * 0.5; // 打出后手牌强度变化

    return score;
  }

  // 模拟对手可能的出牌数量
  private simulateOpponentHand(cardPlayed: Card): number {
    // 简单模拟：假设对手有平均数量的牌
    // 在实际游戏中，这会基于游戏历史进行更准确的估计
    const averageOpponentCards = 6; // 假设对手平均有6张牌

    // 估算对手可能出牌的数量
    // 这里是一个简化的模型
    return Math.max(1, averageOpponentCards * 0.3); // 假设30%的牌可以出
  }
}

// 创建不同难度的AI实例
export const createAI = (difficulty: 'easy' | 'medium' | 'hard'): GameAI => {
  return new GameAI(difficulty);
};

// AI决策延迟（模拟思考时间）
export const getAIDecisionDelay = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'easy':
      return 500 + Math.random() * 500; // 0.5-1秒
    case 'medium':
      return 1000 + Math.random() * 1000; // 1-2秒
    case 'hard':
      return 1500 + Math.random() * 1000; // 1.5-2.5秒
    default:
      return 1000;
  }
};
