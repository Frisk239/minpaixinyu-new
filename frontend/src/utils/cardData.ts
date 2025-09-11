// 卡牌数据生成器
import { Card, CultureType, CardType } from './gameTypes';

// 卡牌文件名到数据的映射
const CARD_FILE_MAPPING: Record<string, { culture: CultureType; type: CardType; name: string }> = {
  // 福州侯官文化
  '福州侯官文化–人物-严复': { culture: 'fuzhou', type: 'character', name: '严复' },
  '福州侯官文化–人物–林觉民': { culture: 'fuzhou', type: 'character', name: '林觉民' },
  '福州侯官文化–人物–林旭': { culture: 'fuzhou', type: 'character', name: '林旭' },
  '福州侯官文化–人物–林则徐': { culture: 'fuzhou', type: 'character', name: '林则徐' },
  '福州侯官文化–人物–沈葆祯': { culture: 'fuzhou', type: 'character', name: '沈葆祯' },

  '福州侯官文化–地点–城隍庙': { culture: 'fuzhou', type: 'location', name: '城隍庙' },
  '福州侯官文化–地点–林则徐纪念馆': { culture: 'fuzhou', type: 'location', name: '林则徐纪念馆' },
  '福州侯官文化–地点–三坊七巷': { culture: 'fuzhou', type: 'location', name: '三坊七巷' },
  '福州侯官文化–地点–严复故居': { culture: 'fuzhou', type: 'location', name: '严复故居' },
  '福州侯官文化–地点–中国船政文化博物馆': { culture: 'fuzhou', type: 'location', name: '中国船政文化博物馆' },

  '福州侯官文化–语录–苟利国家生死以 岂因祸福避趋之': { culture: 'fuzhou', type: 'quote', name: '苟利国家生死以，岂因祸福避趋之' },
  '福州侯官文化–语录–海纳百川 有容乃大 壁立千仞 无欲则刚': { culture: 'fuzhou', type: 'quote', name: '海纳百川，有容乃大；壁立千仞，无欲则刚' },
  '福州侯官文化–语录–物竞天择 适者生存': { culture: 'fuzhou', type: 'quote', name: '物竞天择，适者生存' },
  '福州侯官文化–语录–以天下人为念 为天下人谋永福': { culture: 'fuzhou', type: 'quote', name: '以天下人为念，为天下人谋永福' },
  '福州侯官文化–语录–中学为体 西学为用': { culture: 'fuzhou', type: 'quote', name: '中学为体，西学为用' },

  // 泉州海丝文化
  '泉州海丝文化-人物-弘一法师': { culture: 'quanzhou', type: 'character', name: '弘一法师' },
  '泉州海丝文化-人物-马可·波罗': { culture: 'quanzhou', type: 'character', name: '马可·波罗' },
  '泉州海丝文化-人物-蒲寿庚': { culture: 'quanzhou', type: 'character', name: '蒲寿庚' },
  '泉州海丝文化-人物-王审知': { culture: 'quanzhou', type: 'character', name: '王审知' },
  '泉州海丝文化-人物-郑和': { culture: 'quanzhou', type: 'character', name: '郑和' },

  '泉州海丝文化-地点-开元寺': { culture: 'quanzhou', type: 'location', name: '开元寺' },
  '泉州海丝文化-地点-洛阳桥': { culture: 'quanzhou', type: 'location', name: '洛阳桥' },
  '泉州海丝文化-地点-清净寺': { culture: 'quanzhou', type: 'location', name: '清净寺' },
  '泉州海丝文化-地点-泉州海外交通史博物馆': { culture: 'quanzhou', type: 'location', name: '泉州海外交通史博物馆' },
  '泉州海丝文化-地点-泉州市舶司遗址': { culture: 'quanzhou', type: 'location', name: '泉州市舶司遗址' },

  '泉州海丝文化-语录-苍宫影里三洲路 涨海声中万国商': { culture: 'quanzhou', type: 'quote', name: '苍宫影里三洲路，涨海声中万国商' },
  '泉州海丝文化-语录-此地古称佛国 满街都是圣人': { culture: 'quanzhou', type: 'quote', name: '此地古称佛国，满街都是圣人' },
  '泉州海丝文化-语录-刺桐花开了多少个春天 东西塔对望究竟多少年 多少人走过了洛阳桥 多少船驶出了泉州湾': { culture: 'quanzhou', type: 'quote', name: '刺桐花开了多少个春天，东西塔对望究竟多少年，多少人走过了洛阳桥，多少船驶出了泉州湾' },
  '泉州海丝文化-语录-有风呣通驶尽帆': { culture: 'quanzhou', type: 'quote', name: '有风呣通驶尽帆' },
  '泉州海丝文化-语录-站如东西塔 卧如洛阳桥': { culture: 'quanzhou', type: 'quote', name: '站如东西塔，卧如洛阳桥' },

  // 南平朱子文化
  '南平朱子文化-人物-蔡元定': { culture: 'nanping', type: 'character', name: '蔡元定' },
  '南平朱子文化-人物-黄幹': { culture: 'nanping', type: 'character', name: '黄幹' },
  '南平朱子文化-人物-刘子翠': { culture: 'nanping', type: 'character', name: '刘子翠' },
  '南平朱子文化-人物-真德秀': { culture: 'nanping', type: 'character', name: '真德秀' },
  '南平朱子文化-人物-朱熹': { culture: 'nanping', type: 'character', name: '朱熹' },

  '南平朱子文化-地点-考亭书院': { culture: 'nanping', type: 'location', name: '考亭书院' },
  '南平朱子文化-地点-五经博士府': { culture: 'nanping', type: 'location', name: '五经博士府' },
  '南平朱子文化-地点-武夷精舍': { culture: 'nanping', type: 'location', name: '武夷精舍' },
  '南平朱子文化-地点-兴贤书院': { culture: 'nanping', type: 'location', name: '兴贤书院' },
  '南平朱子文化-地点-紫阳楼': { culture: 'nanping', type: 'location', name: '紫阳楼' },

  '南平朱子文化-语录-存天理 灭人欲': { culture: 'nanping', type: 'quote', name: '存天理，灭人欲' },
  '南平朱子文化-语录-读书之法 在循序而渐进 熟读而精思': { culture: 'nanping', type: 'quote', name: '读书之法，在循序而渐进，熟读而精思' },
  '南平朱子文化-语录-民生之本在食 足食之本在农': { culture: 'nanping', type: 'quote', name: '民生之本在食，足食之本在农' },
  '南平朱子文化-语录-问渠哪得清如许 为有源头活水来': { culture: 'nanping', type: 'quote', name: '问渠哪得清如许，为有源头活水来' },
  '南平朱子文化-语录-勿以善小而不为 勿以恶小而为之': { culture: 'nanping', type: 'quote', name: '勿以善小而不为，勿以恶小而为之' },

  // 龙岩红色文化
  '龙岩红色文化–人物–翟秋白': { culture: 'longyan', type: 'character', name: '翟秋白' },
  '龙岩红色文化–人物–刘亚楼': { culture: 'longyan', type: 'character', name: '刘亚楼' },
  '龙岩红色文化–人物–毛泽东': { culture: 'longyan', type: 'character', name: '毛泽东' },
  '龙岩红色文化–人物–杨成武': { culture: 'longyan', type: 'character', name: '杨成武' },
  '龙岩红色文化–人物–朱德': { culture: 'longyan', type: 'character', name: '朱德' },

  '龙岩红色文化–地点–翟秋白烈士纪念碑': { culture: 'longyan', type: 'location', name: '翟秋白烈士纪念碑' },
  '龙岩红色文化–地点–古田会议旧址': { culture: 'longyan', type: 'location', name: '古田会议旧址' },
  '龙岩红色文化–地点–刘亚楼将军故居': { culture: 'longyan', type: 'location', name: '刘亚楼将军故居' },
  '龙岩红色文化–地点–毛泽东才溪乡调查纪念馆': { culture: 'longyan', type: 'location', name: '毛泽东才溪乡调查纪念馆' },
  '龙岩红色文化–地点–中央苏区历史博物馆': { culture: 'longyan', type: 'location', name: '中央苏区历史博物馆' },

  '龙岩红色文化–语录–没有调查 没有发言权': { culture: 'longyan', type: 'quote', name: '没有调查，没有发言权' },
  '龙岩红色文化–语录–思想建党 政治建军': { culture: 'longyan', type: 'quote', name: '思想建党，政治建军' },
  '龙岩红色文化–语录–苏区干部好作风 自带饭包去办公 日着草鞋干革命 夜走山路访贫农': { culture: 'longyan', type: 'quote', name: '苏区干部好作风，自带饭包去办公，日着草鞋干革命，夜走山路访贫农' },
  '龙岩红色文化–语录–星星之火 可以燎原': { culture: 'longyan', type: 'quote', name: '星星之火，可以燎原' },
  '龙岩红色文化–语录–跃过汀江 直下龙岩上杭': { culture: 'longyan', type: 'quote', name: '跃过汀江，直下龙岩上杭' },

  // 莆田妈祖文化
  '莆田妈祖文化–人物–李少霞': { culture: 'putian', type: 'character', name: '李少霞' },
  '莆田妈祖文化–人物–林默娘': { culture: 'putian', type: 'character', name: '林默娘' },
  '莆田妈祖文化–人物–林惟悫': { culture: 'putian', type: 'character', name: '林惟悫' },
  '莆田妈祖文化–人物–施琅': { culture: 'putian', type: 'character', name: '施琅' },
  '莆田妈祖文化–人物–吴还初': { culture: 'putian', type: 'character', name: '吴还初' },

  '莆田妈祖文化–地点–妈祖阁': { culture: 'putian', type: 'location', name: '妈祖阁' },
  '莆田妈祖文化–地点–湄洲妈祖祖庙': { culture: 'putian', type: 'location', name: '湄洲妈祖祖庙' },
  '莆田妈祖文化–地点–宋代航标塔': { culture: 'putian', type: 'location', name: '宋代航标塔' },
  '莆田妈祖文化–地点–文峰天后宫': { culture: 'putian', type: 'location', name: '文峰天后宫' },
  '莆田妈祖文化–地点–贤良港天后祖祠': { culture: 'putian', type: 'location', name: '贤良港天后祖祠' },

  '莆田妈祖文化–语录–风大找妈祖': { culture: 'putian', type: 'quote', name: '风大找妈祖' },
  '莆田妈祖文化–语录–海神护佑 风平浪静': { culture: 'putian', type: 'quote', name: '海神护佑，风平浪静' },
  '莆田妈祖文化–语录–四海恩波颂莆海 五洲香火祖湄洲': { culture: 'putian', type: 'quote', name: '四海恩波颂莆海，五洲香火祖湄洲' },
  '莆田妈祖文化–语录–文峰宫里看总簿': { culture: 'putian', type: 'quote', name: '文峰宫里看总簿' },
  '莆田妈祖文化–语录–文献名邦历千年 自古人杰地钟灵': { culture: 'putian', type: 'quote', name: '文献名邦历千年，自古人杰地钟灵' },
};

// 生成完整卡牌数据
export function generateCardDeck(): Card[] {
  const cards: Card[] = [];

  Object.entries(CARD_FILE_MAPPING).forEach(([fileName, cardInfo], index) => {
    const card: Card = {
      id: `card_${index + 1}`,
      culture: cardInfo.culture,
      type: cardInfo.type,
      name: cardInfo.name,
      image: `/static/game-card/${fileName}.png`,
      description: `${cardInfo.name} - ${cardInfo.culture} ${cardInfo.type}`
    };
    cards.push(card);
  });

  return cards;
}

// 洗牌算法
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 发牌函数
export function dealCards(deck: Card[], handSize: number): {
  playerHand: Card[];
  aiHand: Card[];
  remainingDeck: Card[];
} {
  const playerHand = deck.slice(0, handSize);
  const aiHand = deck.slice(handSize, handSize * 2);
  const remainingDeck = deck.slice(handSize * 2);

  return {
    playerHand,
    aiHand,
    remainingDeck
  };
}

// 获取起始牌
export function getStartingCard(deck: Card[]): Card {
  return deck[0];
}

// 验证卡牌是否可以出牌
export function canPlayCard(card: Card, currentCard: Card | null): boolean {
  if (!currentCard) return true; // 第一张牌

  // 规则1: 相同文化类型
  if (card.culture === currentCard.culture) return true;

  // 规则2: 相同卡牌类型（人物/地点/语录）
  if (card.type === currentCard.type) return true;

  return false;
}

// 获取所有可出牌
export function getPlayableCards(hand: Card[], currentCard: Card | null): Card[] {
  return hand.filter(card => canPlayCard(card, currentCard));
}

// 检查是否可以叫"闽派"
export function canCallMinpai(hand: Card[]): boolean {
  return hand.length === 1;
}

// 检查游戏是否结束
export function isGameFinished(playerHand: Card[], aiHand: Card[]): boolean {
  return playerHand.length === 0 || aiHand.length === 0;
}

// 获取游戏获胜者
export function getWinner(playerHand: Card[], aiHand: Card[]): 'human' | 'ai' | null {
  if (playerHand.length === 0) return 'human';
  if (aiHand.length === 0) return 'ai';
  return null;
}
