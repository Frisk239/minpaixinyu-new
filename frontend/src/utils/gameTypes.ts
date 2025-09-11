// 游戏相关类型定义

export type CultureType = 'fuzhou' | 'quanzhou' | 'nanping' | 'longyan' | 'putian';
export type CardType = 'character' | 'location' | 'quote';

export interface Card {
  id: string;
  culture: CultureType;
  type: CardType;
  name: string;
  image: string;
  description?: string;
}

export interface GameState {
  // 游戏状态
  gamePhase: 'waiting' | 'playing' | 'finished';
  currentPlayer: 'human' | 'ai';
  currentCard: Card | null;
  deck: Card[];

  // 玩家状态
  playerHand: Card[];
  aiHand: Card[];
  playerCalledMinpai: boolean;
  aiCalledMinpai: boolean;

  // 游戏统计
  penalties: { player: number; ai: number };
  roundCount: number;
  gameStartTime: Date;

  // 游戏结果
  winner: 'human' | 'ai' | null;
  gameEndTime: Date | null;
}

export interface GameMove {
  player: 'human' | 'ai';
  card: Card;
  timestamp: Date;
  isValid: boolean;
  reason?: string;
}

export interface AIStrategy {
  analyzeHand(hand: Card[]): CardAnalysis;
  selectBestCard(hand: Card[], currentCard: Card | null): Card | null;
  shouldCallMinpai(hand: Card[], opponentHandCount: number): boolean;
  shouldReportMinpai(opponentHandCount: number, gameHistory: GameMove[]): boolean;
}

export interface CardAnalysis {
  playableCards: Card[];
  bestCard: Card | null;
  handStrength: number; // 0-100
  cultureDistribution: Record<CultureType, number>;
  typeDistribution: Record<CardType, number>;
}

export interface GameConfig {
  initialHandSize: number;
  maxPenalties: number;
  enableSound: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageGameTime: number;
  bestStreak: number;
  currentStreak: number;
}

// 文化类型映射
export const CULTURE_NAMES: Record<CultureType, string> = {
  fuzhou: '福州侯官文化',
  quanzhou: '泉州海丝文化',
  nanping: '南平朱子文化',
  longyan: '龙岩红色文化',
  putian: '莆田妈祖文化'
};

// 卡牌类型映射
export const CARD_TYPE_NAMES: Record<CardType, string> = {
  character: '人物',
  location: '地点',
  quote: '语录'
};

// 文化主题色
export const CULTURE_COLORS: Record<CultureType, string> = {
  fuzhou: '#FF6B6B',    // 红色系
  quanzhou: '#4ECDC4',  // 青色系
  nanping: '#45B7D1',   // 蓝色系
  longyan: '#F7DC6F',   // 金色系
  putian: '#BB8FCE'     // 紫色系
};
